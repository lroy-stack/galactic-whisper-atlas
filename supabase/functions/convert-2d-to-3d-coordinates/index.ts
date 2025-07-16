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

// **FIXED SCALE**: Realistic galactic proportions (1 unit ≈ 2 light-years)
const REGION_BOUNDS: Record<string, RegionBounds> = {
  'Deep Core': { minRadius: 0, maxRadius: 1250, minHeight: -250, maxHeight: 250 },
  'Core Worlds': { minRadius: 1250, maxRadius: 2500, minHeight: -375, maxHeight: 375 },
  'Colonies': { minRadius: 2500, maxRadius: 4375, minHeight: -500, maxHeight: 500 },
  'Inner Rim': { minRadius: 4375, maxRadius: 6250, minHeight: -625, maxHeight: 625 },
  'Expansion Region': { minRadius: 6250, maxRadius: 9375, minHeight: -750, maxHeight: 750 },
  'Mid Rim': { minRadius: 9375, maxRadius: 15000, minHeight: -1000, maxHeight: 1000 },
  'Outer Rim Territories': { minRadius: 15000, maxRadius: 22500, minHeight: -1250, maxHeight: 1250 },
  'Outer Rim': { minRadius: 15000, maxRadius: 22500, minHeight: -1250, maxHeight: 1250 },
  'Wild Space': { minRadius: 22500, maxRadius: 25000, minHeight: -1500, maxHeight: 1500 },
  'Unknown Regions': { minRadius: 22500, maxRadius: 25000, minHeight: -1500, maxHeight: 1500 },
  'Hutt Space': { minRadius: 17500, maxRadius: 23750, minHeight: -1125, maxHeight: 1125 },
  'Corporate Sector': { minRadius: 10000, maxRadius: 16250, minHeight: -1063, maxHeight: 1063 }
};

const DEFAULT_BOUNDS: RegionBounds = { minRadius: 12500, maxRadius: 22500, minHeight: -1250, maxHeight: 1250 };

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

// **FIXED**: Correct angular distribution for A-Z (26 letters, not 25)
function letterToAngle(letter: string): number {
  const charCode = letter.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  return (charCode / 26) * Math.PI * 2; // **CORRECTED**: Divide by 26 for uniform distribution
}

// **ENHANCED**: Optimized distribution with spiral arm clustering
function numberToRadius(number: number, region: string): number {
  const bounds = REGION_BOUNDS[region] || DEFAULT_BOUNDS;
  const normalizedPosition = Math.max(0, Math.min(1, (number - 1) / 23)); // Clamp to 0-1
  
  // Add spiral arm clustering effect (5% variation)
  const clusteredPosition = normalizedPosition + 
    Math.sin(normalizedPosition * Math.PI * 6) * 0.05;
  
  return bounds.minRadius + (bounds.maxRadius - bounds.minRadius) * 
    Math.max(0, Math.min(1, clusteredPosition));
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
  
  // **ENHANCED**: Add subtle spiral arm structure to galactic disk
  const spiralInfluence = 0.02; // 2% spiral effect
  const spiralArms = 2; // Two-arm spiral galaxy
  const spiralOffset = Math.sin(angle * spiralArms + radius * 0.0001) * spiralInfluence * radius;
  
  // Convert to Cartesian coordinates (X, Z for disk, Y for height)
  const x = Math.cos(angle) * (radius + spiralOffset);
  const z = Math.sin(angle) * (radius + spiralOffset);
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
        if (radius <= 25000 && Math.abs(coord.coordinate_y) <= 1500) { // **CORRECTED**: Realistic bounds
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
            scale: "1 unit ≈ 2 light-years",
            diskDiameter: "~100,000 light-years (50,000 units)",
            diskHeight: "Variable by region (±250 to ±1500 units)",
            coordinate_system: "X,Z = galactic disk plane, Y = height above/below plane",
            improvements: "Fixed angular distribution, realistic scaling, spiral arm clustering"
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