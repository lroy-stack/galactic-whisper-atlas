// CORS headers for web app requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import Supabase client for Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const BATCH_SIZE = 50; // Process systems in batches
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Galactic disk coordinate conversion functions
interface RegionBounds {
  minRadius: number;
  maxRadius: number;
  minHeight: number;
  maxHeight: number;
}

const REGION_BOUNDS: Record<string, RegionBounds> = {
  'Deep Core': { minRadius: 0, maxRadius: 100, minHeight: -20, maxHeight: 20 },
  'Core Worlds': { minRadius: 100, maxRadius: 200, minHeight: -30, maxHeight: 30 },
  'Colonies': { minRadius: 200, maxRadius: 350, minHeight: -40, maxHeight: 40 },
  'Inner Rim': { minRadius: 350, maxRadius: 500, minHeight: -50, maxHeight: 50 },
  'Expansion Region': { minRadius: 500, maxRadius: 750, minHeight: -60, maxHeight: 60 },
  'Mid Rim': { minRadius: 750, maxRadius: 1200, minHeight: -80, maxHeight: 80 },
  'Outer Rim Territories': { minRadius: 1200, maxRadius: 1800, minHeight: -100, maxHeight: 100 },
  'Outer Rim': { minRadius: 1200, maxRadius: 1800, minHeight: -100, maxHeight: 100 },
  'Wild Space': { minRadius: 1800, maxRadius: 2000, minHeight: -120, maxHeight: 120 },
  'Unknown Regions': { minRadius: 1800, maxRadius: 2000, minHeight: -120, maxHeight: 120 },
  'Hutt Space': { minRadius: 1400, maxRadius: 1900, minHeight: -90, maxHeight: 90 },
  'Corporate Sector': { minRadius: 800, maxRadius: 1300, minHeight: -85, maxHeight: 85 }
};

const DEFAULT_BOUNDS: RegionBounds = { minRadius: 1000, maxRadius: 1800, minHeight: -100, maxHeight: 100 };

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function parseGridCoordinates(gridCoords: string): { letter: string; number: number } | null {
  const match = gridCoords.match(/^([A-Z])-?(\d+)$/i);
  if (!match) return null;
  
  return {
    letter: match[1].toUpperCase(),
    number: parseInt(match[2], 10)
  };
}

function letterToAngle(letter: string): number {
  const charCode = letter.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  return (charCode / 25) * Math.PI * 2;
}

function numberToRadius(number: number, region: string): number {
  const bounds = REGION_BOUNDS[region] || DEFAULT_BOUNDS;
  const normalizedPosition = (number - 1) / 23; // 0 to 1
  return bounds.minRadius + (bounds.maxRadius - bounds.minRadius) * normalizedPosition;
}

function calculateHeight(
  region: string,
  systemName: string,
  population?: number,
  classification?: string
): number {
  const bounds = REGION_BOUNDS[region] || DEFAULT_BOUNDS;
  
  const seed = hashString(systemName + region);
  const baseRandom = seededRandom(seed);
  
  let y = bounds.minHeight + (bounds.maxHeight - bounds.minHeight) * baseRandom;
  
  // Population adjustment
  if (population && population > 0) {
    const populationFactor = Math.min(Math.log10(population) / 12, 1);
    const centeringEffect = populationFactor * 0.4;
    y *= (1 - centeringEffect);
  }
  
  // Classification adjustment
  if (classification) {
    const centralizedTypes = ['Capital', 'Trade Hub', 'Industrial', 'Core World'];
    const frontierTypes = ['Frontier', 'Mining', 'Agricultural', 'Backwater'];
    
    if (centralizedTypes.some(type => classification.includes(type))) {
      y *= 0.6;
    } else if (frontierTypes.some(type => classification.includes(type))) {
      y *= 1.4;
    }
  }
  
  // Add noise
  const noiseSeed = hashString(systemName + 'height');
  const noise = (seededRandom(noiseSeed) - 0.5) * 0.3;
  y *= (1 + noise);
  
  return Math.max(bounds.minHeight, Math.min(bounds.maxHeight, y));
}

function convert2DTo3D(
  gridCoordinates: string,
  region: string,
  systemName: string,
  population?: number,
  classification?: string
): { x: number; y: number; z: number } | null {
  const parsed = parseGridCoordinates(gridCoordinates);
  if (!parsed) return null;
  
  const angle = letterToAngle(parsed.letter);
  const radius = numberToRadius(parsed.number, region);
  const height = calculateHeight(region, systemName, population, classification);
  
  // Convert to Cartesian coordinates (X, Z for disk, Y for height)
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = height;
  
  return { x, y, z };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting 2D to 3D coordinate conversion process...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Get total count of systems with grid coordinates
    const { count: totalSystems, error: countError } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .not('grid_coordinates', 'is', null);
    
    if (countError) {
      throw new Error(`Failed to count systems: ${countError.message}`);
    }
    
    console.log(`Total systems to convert: ${totalSystems}`);
    
    if (totalSystems === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No systems with grid coordinates found to convert',
          totalSystems: 0,
          convertedSystems: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    const totalBatches = Math.ceil(totalSystems / BATCH_SIZE);
    let convertedSystems = 0;
    let conversionErrors = 0;
    const regionStats: Record<string, number> = {};
    
    console.log(`Processing in ${totalBatches} batches of ${BATCH_SIZE} systems each`);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const offset = batch * BATCH_SIZE;
      console.log(`Processing batch ${batch + 1}/${totalBatches} (offset: ${offset})`);
      
      // Fetch batch of systems with grid coordinates
      const { data: systems, error: fetchError } = await supabase
        .from('galactic_systems')
        .select('id, name, grid_coordinates, region, population, classification')
        .not('grid_coordinates', 'is', null)
        .range(offset, offset + BATCH_SIZE - 1);
      
      if (fetchError) {
        console.error(`Batch ${batch + 1} fetch error:`, fetchError);
        continue;
      }
      
      if (!systems || systems.length === 0) {
        console.log(`Batch ${batch + 1}: No systems found`);
        continue;
      }
      
      console.log(`Converting ${systems.length} systems in batch ${batch + 1}`);
      
      // Convert coordinates for each system
      const updates = [];
      let batchErrors = 0;
      
      for (const system of systems) {
        try {
          const coordinates = convert2DTo3D(
            system.grid_coordinates,
            system.region,
            system.name,
            system.population,
            system.classification
          );
          
          if (coordinates) {
            updates.push({
              id: system.id,
              coordinate_x: coordinates.x,
              coordinate_y: coordinates.y,
              coordinate_z: coordinates.z,
              updated_at: new Date().toISOString()
            });
            
            // Track region statistics
            regionStats[system.region] = (regionStats[system.region] || 0) + 1;
          } else {
            console.error(`Failed to convert coordinates for system: ${system.name} (${system.grid_coordinates})`);
            batchErrors++;
          }
        } catch (error) {
          console.error(`Conversion error for system ${system.name}:`, error);
          batchErrors++;
        }
      }
      
      // Update coordinates in database (one by one to avoid upsert issues)
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('galactic_systems')
          .update({
            coordinate_x: update.coordinate_x,
            coordinate_y: update.coordinate_y,
            coordinate_z: update.coordinate_z,
            updated_at: update.updated_at
          })
          .eq('id', update.id);
        
        if (updateError) {
          console.error(`Error updating system ID ${update.id}:`, updateError);
          conversionErrors++;
        } else {
          convertedSystems++;
        }
      }
      
      if (updates.length > 0) {
        console.log(`Batch ${batch + 1}: Processed ${updates.length} systems`);
      }
      
      if (batchErrors > 0) {
        console.log(`Batch ${batch + 1}: ${batchErrors} conversion errors out of ${systems.length} systems`);
        conversionErrors += batchErrors;
      }
      
      // Progress update
      const progress = Math.round(((batch + 1) / totalBatches) * 100);
      console.log(`Progress: ${progress}% (${convertedSystems}/${totalSystems} systems converted)`);
    }
    
    console.log('✅ 2D to 3D coordinate conversion completed!');
    console.log(`Total systems converted: ${convertedSystems}`);
    console.log(`Conversion errors: ${conversionErrors}`);
    console.log('Region statistics:', regionStats);
    
    // Validate converted coordinates
    const { data: validationData, error: validationError } = await supabase
      .from('galactic_systems')
      .select('coordinate_x, coordinate_y, coordinate_z')
      .not('coordinate_x', 'is', null)
      .not('coordinate_y', 'is', null)
      .not('coordinate_z', 'is', null);
    
    let validationResults = { withinBounds: 0, outOfBounds: 0 };
    
    if (!validationError && validationData) {
      for (const coord of validationData) {
        const radius = Math.sqrt(coord.coordinate_x * coord.coordinate_x + coord.coordinate_z * coord.coordinate_z);
        if (radius <= 2000 && Math.abs(coord.coordinate_y) <= 120) {
          validationResults.withinBounds++;
        } else {
          validationResults.outOfBounds++;
        }
      }
    }
    
    console.log('Validation results:', validationResults);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully converted ${convertedSystems} systems from 2D to 3D galactic disk coordinates`,
        details: {
          totalSystems,
          convertedSystems,
          conversionErrors,
          regionStats,
          validation: validationResults,
          newCoordinateSystem: {
            scale: "1 unit = 25 light-years",
            diskDiameter: "100,000 light-years (4000 units)",
            diskHeight: "Variable by region (±20 to ±120 units)",
            coordinate_system: "X,Z = galactic disk plane, Y = height above/below plane"
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('❌ Conversion process failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to convert coordinates',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});