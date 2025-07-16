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

// Region boundaries for galactic positioning
interface RegionBounds {
  zRange: { min: number; max: number };
  spiralArm?: string;
}

const REGION_BOUNDS: Record<string, RegionBounds> = {
  'Deep Core': { zRange: { min: -2500, max: 2500 }, spiralArm: 'central' },
  'Core Worlds': { zRange: { min: -2500, max: 2500 }, spiralArm: 'central' },
  'Colonies': { zRange: { min: -5000, max: 5000 }, spiralArm: 'inner' },
  'Inner Rim': { zRange: { min: -5000, max: 5000 }, spiralArm: 'inner' },
  'Expansion Region': { zRange: { min: -7500, max: 7500 }, spiralArm: 'middle' },
  'Mid Rim': { zRange: { min: -7500, max: 7500 }, spiralArm: 'middle' },
  'Outer Rim': { zRange: { min: -12500, max: 12500 }, spiralArm: 'outer' },
  'Wild Space': { zRange: { min: -15000, max: 15000 }, spiralArm: 'outer' },
  'Unknown Regions': { zRange: { min: -15000, max: 15000 }, spiralArm: 'outer' }
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
  const baseRadius = (number / 24) * 65000; // 0 to ~65,000 light-years
  
  // Apply spiral arm clustering
  const spiralArm = REGION_BOUNDS[region]?.spiralArm || 'outer';
  const spiralVariation = spiralArm === 'central' ? 0.8 : 
                         spiralArm === 'inner' ? 0.9 : 
                         spiralArm === 'middle' ? 1.0 : 1.1;
  
  return baseRadius * spiralVariation;
}

function calculateHeight(region: string, systemName: string, population?: number, classification?: string): number {
  const bounds = REGION_BOUNDS[region] || REGION_BOUNDS['Outer Rim'];
  
  // Base random height within region bounds
  const seed = hashString(systemName + region);
  const baseHeight = bounds.zRange.min + seededRandom(seed) * (bounds.zRange.max - bounds.zRange.min);
  
  // Population influence (more populated = closer to galactic plane)
  let heightModifier = 1.0;
  if (population) {
    if (population > 1e9) heightModifier = 0.3; // Major worlds
    else if (population > 1e6) heightModifier = 0.6; // Populated worlds
    else if (population > 1e3) heightModifier = 0.8; // Minor settlements
  }
  
  // Classification influence
  if (classification) {
    if (classification.toLowerCase().includes('capital')) heightModifier *= 0.2;
    else if (classification.toLowerCase().includes('major')) heightModifier *= 0.4;
    else if (classification.toLowerCase().includes('mining')) heightModifier *= 1.2;
  }
  
  return baseHeight * heightModifier;
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
  
  // Convert letter to angle (0 to 2π)
  const angle = letterToAngle(parsed.letter);
  
  // Convert number to radius (0 to ~65,000 light-years)
  const radius = numberToRadius(parsed.number, region);
  
  // Calculate X and Y using polar coordinates
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  
  // Calculate Z based on region and system characteristics
  const z = calculateHeight(region, systemName, population, classification);
  
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