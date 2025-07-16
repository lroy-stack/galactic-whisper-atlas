// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import Supabase client for Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const BATCH_SIZE = 50;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Region boundaries for galactic positioning (unified with client)
interface RegionBounds {
  minRadius: number;
  maxRadius: number;
  minHeight: number;
  maxHeight: number;
}

const REGION_BOUNDS: Record<string, RegionBounds> = {
  'Deep Core': { minRadius: 0, maxRadius: 200, minHeight: -25, maxHeight: 25 },
  'Core Worlds': { minRadius: 200, maxRadius: 500, minHeight: -40, maxHeight: 40 },
  'Colonies': { minRadius: 500, maxRadius: 800, minHeight: -50, maxHeight: 50 },
  'Inner Rim': { minRadius: 800, maxRadius: 1200, minHeight: -60, maxHeight: 60 },
  'Expansion Region': { minRadius: 1200, maxRadius: 1500, minHeight: -70, maxHeight: 70 },
  'Mid Rim': { minRadius: 1500, maxRadius: 1800, minHeight: -75, maxHeight: 75 },
  'Outer Rim Territories': { minRadius: 1800, maxRadius: 2200, minHeight: -80, maxHeight: 80 },
  'Wild Space': { minRadius: 2200, maxRadius: 2600, minHeight: -90, maxHeight: 90 },
  'Unknown Regions': { minRadius: 2600, maxRadius: 3000, minHeight: -100, maxHeight: 100 },
  'Hutt Space': { minRadius: 1600, maxRadius: 1900, minHeight: -75, maxHeight: 75 },
  'Corporate Sector': { minRadius: 1400, maxRadius: 1700, minHeight: -70, maxHeight: 70 }
};

// Utility functions for coordinate conversion
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function parseGridCoordinates(gridCoords: string): { letter: string; number: number } | null {
  const match = gridCoords.match(/^([A-Z])-(\d+)$/);
  if (!match) return null;
  
  return {
    letter: match[1],
    number: parseInt(match[2], 10)
  };
}

function letterToAngle(letter: string): number {
  const letterIndex = letter.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  return (letterIndex / 26) * 2 * Math.PI; // 0 to 2π
}

function numberToRadius(number: number, region: string): number {
  const bounds = REGION_BOUNDS[region] || REGION_BOUNDS['Unknown Regions'];
  
  // Normalized position (0-1) with optimization for 1-24 range
  const normalizedPosition = Math.max(0, Math.min(1, (number - 1) / 23));
  
  // Add spiral clustering effect
  const clusteredPosition = normalizedPosition + 
    Math.sin(normalizedPosition * Math.PI * 6) * 0.05;
  
  return bounds.minRadius + (bounds.maxRadius - bounds.minRadius) * 
    Math.max(0, Math.min(1, clusteredPosition));
}

function calculateHeight(region: string, systemName: string, population?: number, classification?: string): number {
  const bounds = REGION_BOUNDS[region] || REGION_BOUNDS['Unknown Regions'];
  
  // Use system name as seed for consistent positioning
  const seed = hashString(systemName + region);
  const baseRandom = seededRandom(seed);
  
  // Base Y position within region height bounds
  let y = bounds.minHeight + (bounds.maxHeight - bounds.minHeight) * baseRandom;
  
  // Adjust Y based on population (more populated = closer to galactic plane)
  if (population && population > 0) {
    const populationFactor = Math.min(Math.log10(population) / 12, 1);
    const centeringEffect = populationFactor * 0.4;
    y *= (1 - centeringEffect);
  }
  
  // Adjust Y based on classification
  if (classification) {
    const centralizedTypes = ['Capital', 'Trade Hub', 'Industrial', 'Core World'];
    const frontierTypes = ['Frontier', 'Mining', 'Agricultural', 'Backwater'];
    
    if (centralizedTypes.some(type => classification.includes(type))) {
      y *= 0.6;
    } else if (frontierTypes.some(type => classification.includes(type))) {
      y *= 1.4;
    }
  }
  
  // Add controlled noise
  const noiseSeed = hashString(systemName + 'height');
  const noise = (seededRandom(noiseSeed) - 0.5) * 0.3;
  y *= (1 + noise);
  
  // Ensure we stay within bounds
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
  
  // Convert 2D coordinates to galactic disk position
  const baseAngle = letterToAngle(parsed.letter);
  const baseRadius = numberToRadius(parsed.number, region);
  const height = calculateHeight(region, systemName, population, classification);
  
  // **NEW**: Add unique dispersion within grid cell to prevent stacking
  const gridSeed = hashString(systemName + gridCoordinates + region);
  const cellVariation = seededRandom(gridSeed);
  
  // Disperse within grid cell boundaries (±8% radius and ±7.5° angle)
  const radiusDispersion = (cellVariation - 0.5) * 0.16; // ±8%
  const angleDispersion = (seededRandom(gridSeed * 2) - 0.5) * 0.26; // ±7.5° in radians
  
  const dispersedRadius = baseRadius * (1 + radiusDispersion);
  const dispersedAngle = baseAngle + angleDispersion;
  
  // Convert polar coordinates to Cartesian (X, Z for disk plane, Y for height)
  const x = Math.cos(dispersedAngle) * dispersedRadius;
  const z = Math.sin(dispersedAngle) * dispersedRadius;
  const y = height;
  
  return { x, y, z };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗺️ Starting 2D to 3D coordinate mapping process');

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Count systems that need coordinate mapping (have grid_coordinates but no 3D coordinates)
    const { count: totalSystems, error: countError } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .not('grid_coordinates', 'is', null)
      .is('coordinate_x', null);

    if (countError) {
      console.error('❌ Error counting systems:', countError);
      throw countError;
    }

    const systemsToMap = totalSystems || 0;
    console.log(`📊 Found ${systemsToMap} systems to map from 2D to 3D`);

    if (systemsToMap === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No systems need coordinate mapping',
          totalProcessed: 0,
          systemsToMap: 0,
          isComplete: true,
          batches: [],
          summary: {
            startedWith: 0,
            processed: 0,
            mapped: 0
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let processedSystems = 0;
    let mappedSystems = 0;
    let offset = 0;
    const results = [];

    // Process in batches
    while (processedSystems < systemsToMap) {
      const batchStart = Date.now();
      
      // Fetch batch of systems that need mapping
      const { data: systemsBatch, error: fetchError } = await supabase
        .from('galactic_systems')
        .select('id, name, region, grid_coordinates, population, classification')
        .not('grid_coordinates', 'is', null)
        .is('coordinate_x', null)
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) {
        console.error('❌ Error fetching systems batch:', fetchError);
        throw fetchError;
      }

      if (!systemsBatch || systemsBatch.length === 0) {
        break;
      }

      console.log(`🔄 Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${systemsBatch.length} systems`);

      // Convert and update coordinates for each system in batch
      const updates = [];
      for (const system of systemsBatch) {
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
            coordinate_z: coordinates.z
          });
        }
      }

      // Bulk update coordinates
      if (updates.length > 0) {
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('galactic_systems')
            .update({
              coordinate_x: update.coordinate_x,
              coordinate_y: update.coordinate_y,
              coordinate_z: update.coordinate_z
            })
            .eq('id', update.id);

          if (updateError) {
            console.error(`❌ Error updating system ${update.id}:`, updateError);
          } else {
            mappedSystems++;
          }
        }
      }

      processedSystems += systemsBatch.length;
      offset += BATCH_SIZE;

      const batchTime = Date.now() - batchStart;
      const progress = Math.min(100, (processedSystems / systemsToMap) * 100);

      results.push({
        batch: Math.floor(offset / BATCH_SIZE),
        processed: systemsBatch.length,
        mapped: updates.length,
        totalProcessed: processedSystems,
        totalMapped: mappedSystems,
        progress: Math.round(progress),
        timeMs: batchTime
      });

      console.log(`✅ Batch ${Math.floor(offset / BATCH_SIZE)}: Mapped ${updates.length}/${systemsBatch.length} systems (${progress.toFixed(1)}% complete)`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final verification
    const { count: remainingSystems } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .not('grid_coordinates', 'is', null)
      .is('coordinate_x', null);

    console.log(`✅ Mapping complete! Processed ${processedSystems} systems, mapped ${mappedSystems} coordinates`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully mapped ${mappedSystems} systems from 2D to 3D coordinates`,
        totalProcessed: processedSystems,
        totalMapped: mappedSystems,
        systemsToMap,
        remainingSystems: remainingSystems || 0,
        isComplete: (remainingSystems || 0) === 0,
        batches: results,
        summary: {
          startedWith: systemsToMap,
          processed: processedSystems,
          mapped: mappedSystems
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in map-2d-to-3d-coordinates function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});