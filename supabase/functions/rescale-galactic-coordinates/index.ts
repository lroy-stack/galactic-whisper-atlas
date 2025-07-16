import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Optimized regional scaling configuration - manageable galactic scale
const REGION_CONFIG = {
  'Deep Core': { maxRadius: 50000, priority: 1 },
  'Core Worlds': { maxRadius: 100000, priority: 2 },
  'Colonies': { maxRadius: 200000, priority: 3 },
  'Inner Rim': { maxRadius: 250000, priority: 3 },
  'Expansion Region': { maxRadius: 350000, priority: 4 },
  'Mid Rim': { maxRadius: 400000, priority: 4 },
  'Outer Rim': { maxRadius: 450000, priority: 5 },
  'Wild Space': { maxRadius: 500000, priority: 6 },
  'Unknown Regions': { maxRadius: 500000, priority: 6 }
};

// Processing configuration
const BATCH_SIZE = 200; // Reduced batch size for better performance
const UPDATE_CHUNK_SIZE = 50; // Multiple updates in one operation
const MIN_SEPARATION = 1000; // Reasonable separation
const TARGET_SCALE = 500000; // Target coordinate range: -500k to +500k

interface System {
  id: string;
  name: string;
  region: string;
  coordinate_x: number | null;
  coordinate_y: number | null;
  coordinate_z: number | null;
  grid_coordinates: string | null;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

interface RegionCenter {
  x: number;
  y: number;
  z: number;
  count: number;
}

interface ProcessingState {
  totalSystems: number;
  processedSystems: number;
  updatedSystems: number;
  currentOffset: number;
  bounds: Bounds;
  galacticCenter: { x: number; y: number; z: number };
  regionCenters: Record<string, RegionCenter>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  stats: {
    totalSystems: number;
    validCoordinates: number;
    duplicatePositions: number;
    outOfRange: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting coordinate rescaling process...');

    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .not('coordinate_x', 'is', null)
      .not('coordinate_y', 'is', null)
      .not('coordinate_z', 'is', null);

    if (countError) {
      throw new Error(`Failed to count systems: ${countError.message}`);
    }

    if (!totalCount || totalCount === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No systems with coordinates found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Total systems to process: ${totalCount}`);

    // Calculate bounds and region centers using all data (sampling approach for large datasets)
    let bounds: Bounds;
    let regionCenters: Record<string, RegionCenter>;
    let galacticCenter: { x: number; y: number; z: number };

    if (totalCount <= 2000) {
      // For smaller datasets, process all at once
      const { data: allSystems, error: fetchError } = await supabase
        .from('galactic_systems')
        .select('id, name, region, coordinate_x, coordinate_y, coordinate_z, grid_coordinates')
        .not('coordinate_x', 'is', null)
        .not('coordinate_y', 'is', null)
        .not('coordinate_z', 'is', null);

      if (fetchError) {
        throw new Error(`Failed to fetch systems: ${fetchError.message}`);
      }

      bounds = calculateBounds(allSystems as System[]);
      regionCenters = calculateRegionCenters(allSystems as System[]);
      galacticCenter = regionCenters['Core Worlds'] || regionCenters['Deep Core'] || { x: 0, y: 0, z: 0 };
    } else {
      // For large datasets, use statistical sampling
      console.log('Large dataset detected, using sampling approach...');
      
      // Sample 1000 systems for bounds and region calculations
      const { data: sampleSystems, error: sampleError } = await supabase
        .from('galactic_systems')
        .select('id, name, region, coordinate_x, coordinate_y, coordinate_z, grid_coordinates')
        .not('coordinate_x', 'is', null)
        .not('coordinate_y', 'is', null)
        .not('coordinate_z', 'is', null)
        .limit(1000);

      if (sampleError) {
        throw new Error(`Failed to fetch sample systems: ${sampleError.message}`);
      }

      bounds = calculateBounds(sampleSystems as System[]);
      regionCenters = calculateRegionCenters(sampleSystems as System[]);
      galacticCenter = regionCenters['Core Worlds'] || regionCenters['Deep Core'] || { x: 0, y: 0, z: 0 };
    }

    console.log('Calculated bounds:', bounds);
    console.log('Region centers:', regionCenters);
    console.log('Galactic center:', galacticCenter);

    // Process systems in optimized batches
    let totalUpdated = 0;
    let batchNumber = 0;
    const totalBatches = Math.ceil(totalCount / BATCH_SIZE);

    for (let offset = 0; offset < totalCount; offset += BATCH_SIZE) {
      batchNumber++;
      console.log(`Processing batch ${batchNumber}/${totalBatches} (offset: ${offset})`);

      try {
        // Fetch batch of systems
        const { data: systemBatch, error: fetchError } = await supabase
          .from('galactic_systems')
          .select('id, name, region, coordinate_x, coordinate_y, coordinate_z, grid_coordinates')
          .not('coordinate_x', 'is', null)
          .not('coordinate_y', 'is', null)
          .not('coordinate_z', 'is', null)
          .range(offset, offset + BATCH_SIZE - 1);

        if (fetchError) {
          console.error(`Failed to fetch batch at offset ${offset}:`, fetchError);
          continue;
        }

        if (!systemBatch || systemBatch.length === 0) {
          console.log(`No more systems at offset ${offset}`);
          break;
        }

        // Rescale this batch with optimized algorithm
        const rescaledBatch = rescaleSystemsOptimized(systemBatch as System[], bounds, galacticCenter, regionCenters);
        console.log(`Rescaled ${rescaledBatch.length} systems in batch ${batchNumber}`);

        // Update using optimized upsert approach
        const updateResult = await updateSystemsInChunks(supabase, rescaledBatch);
        totalUpdated += updateResult.updated;
        
        if (updateResult.errors > 0) {
          console.warn(`Batch ${batchNumber}: ${updateResult.errors} update errors out of ${rescaledBatch.length} systems`);
        }

        console.log(`Completed batch ${batchNumber}/${totalBatches}, updated: ${updateResult.updated}, total so far: ${totalUpdated}`);
        
        // Progress tracking
        const progressPercent = Math.round((batchNumber / totalBatches) * 100);
        console.log(`Progress: ${progressPercent}% (${totalUpdated}/${totalCount} systems)`);

      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    // Validate results
    console.log('Validating rescaled coordinates...');
    const validation = await validateRescaledCoordinates(supabase);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully rescaled coordinates for ${totalUpdated} systems`,
      details: {
        totalSystems: totalCount,
        updatedSystems: totalUpdated,
        successRate: Math.round((totalUpdated / totalCount) * 100),
        originalBounds: bounds,
        galacticCenter: galacticCenter,
        regionCenters: Object.keys(regionCenters),
        validation: validation
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in rescale-galactic-coordinates:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function calculateBounds(systems: System[]): Bounds {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity; 
  let minZ = Infinity, maxZ = -Infinity;

  for (const system of systems) {
    if (system.coordinate_x !== null) {
      minX = Math.min(minX, system.coordinate_x);
      maxX = Math.max(maxX, system.coordinate_x);
    }
    if (system.coordinate_y !== null) {
      minY = Math.min(minY, system.coordinate_y);
      maxY = Math.max(maxY, system.coordinate_y);
    }
    if (system.coordinate_z !== null) {
      minZ = Math.min(minZ, system.coordinate_z);
      maxZ = Math.max(maxZ, system.coordinate_z);
    }
  }

  return { minX, maxX, minY, maxY, minZ, maxZ };
}

function calculateRegionCenters(systems: System[]): Record<string, RegionCenter> {
  const regionData: Record<string, { sumX: number; sumY: number; sumZ: number; count: number }> = {};

  for (const system of systems) {
    if (system.coordinate_x !== null && system.coordinate_y !== null && system.coordinate_z !== null) {
      if (!regionData[system.region]) {
        regionData[system.region] = { sumX: 0, sumY: 0, sumZ: 0, count: 0 };
      }
      
      regionData[system.region].sumX += system.coordinate_x;
      regionData[system.region].sumY += system.coordinate_y;
      regionData[system.region].sumZ += system.coordinate_z;
      regionData[system.region].count++;
    }
  }

  const centers: Record<string, RegionCenter> = {};
  for (const [region, data] of Object.entries(regionData)) {
    centers[region] = {
      x: data.sumX / data.count,
      y: data.sumY / data.count,
      z: data.sumZ / data.count,
      count: data.count
    };
  }

  return centers;
}

// Optimized rescaling function with grid-based collision avoidance
function rescaleSystemsOptimized(
  systems: System[], 
  bounds: Bounds, 
  galacticCenter: { x: number; y: number; z: number },
  regionCenters: Record<string, RegionCenter>
): System[] {
  const rescaled: System[] = [];
  
  // Calculate reasonable expansion factor based on current bounds
  const currentRange = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
    bounds.maxZ - bounds.minZ
  );
  const expansionFactor = Math.max(10, TARGET_SCALE / currentRange);
  
  console.log(`Using expansion factor: ${expansionFactor.toFixed(2)}`);
  
  // Grid-based collision avoidance (much more efficient than O(n²))
  const gridSize = MIN_SEPARATION * 2;
  const occupiedGrid = new Set<string>();

  for (const system of systems) {
    if (system.coordinate_x === null || system.coordinate_y === null || system.coordinate_z === null) {
      rescaled.push(system);
      continue;
    }

    // Get region configuration
    const regionConfig = REGION_CONFIG[system.region] || REGION_CONFIG['Unknown Regions'];

    // Scale coordinates with optimized expansion factor
    let x = (system.coordinate_x - galacticCenter.x) * expansionFactor;
    let y = (system.coordinate_y - galacticCenter.y) * expansionFactor;
    let z = (system.coordinate_z - galacticCenter.z) * expansionFactor;

    // Apply region-based constraints
    const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);
    if (distanceFromCenter > regionConfig.maxRadius) {
      const scale = regionConfig.maxRadius / distanceFromCenter;
      x *= scale;
      y *= scale;
      z *= scale;
    }

    // Grid-based collision avoidance
    let finalX = x, finalY = y, finalZ = z;
    let attempts = 0;
    const maxAttempts = 5; // Reduced attempts for better performance

    while (attempts < maxAttempts) {
      const gridKey = `${Math.floor(finalX / gridSize)},${Math.floor(finalY / gridSize)},${Math.floor(finalZ / gridSize)}`;
      
      if (!occupiedGrid.has(gridKey)) {
        occupiedGrid.add(gridKey);
        break;
      }

      // Simple offset strategy instead of complex collision detection
      const offset = MIN_SEPARATION * (1 + attempts);
      const angle = Math.random() * 2 * Math.PI;
      finalX = x + Math.cos(angle) * offset;
      finalY = y + Math.sin(angle) * offset;
      finalZ = z + (Math.random() - 0.5) * offset;
      
      attempts++;
    }

    // Ensure coordinates are within target range
    finalX = Math.max(-TARGET_SCALE, Math.min(TARGET_SCALE, finalX));
    finalY = Math.max(-TARGET_SCALE, Math.min(TARGET_SCALE, finalY));
    finalZ = Math.max(-TARGET_SCALE, Math.min(TARGET_SCALE, finalZ));

    rescaled.push({
      ...system,
      coordinate_x: Math.round(finalX),
      coordinate_y: Math.round(finalY),
      coordinate_z: Math.round(finalZ)
    });
  }

  return rescaled;
}

// Optimized bulk update function with proper counting
async function updateSystemsInChunks(supabase: any, systems: System[]): Promise<{ updated: number; errors: number }> {
  let totalUpdated = 0;
  let totalErrors = 0;

  // Process in chunks for better performance
  for (let i = 0; i < systems.length; i += UPDATE_CHUNK_SIZE) {
    const chunk = systems.slice(i, i + UPDATE_CHUNK_SIZE);
    
    try {
      // Update each system individually to get accurate count
      let chunkUpdated = 0;
      let chunkErrors = 0;

      for (const system of chunk) {
        try {
          const { error, count } = await supabase
            .from('galactic_systems')
            .update({
              coordinate_x: system.coordinate_x,
              coordinate_y: system.coordinate_y,
              coordinate_z: system.coordinate_z,
              updated_at: new Date().toISOString()
            })
            .eq('id', system.id)
            .select('id', { count: 'exact', head: true });

          if (error) {
            console.error(`Update error for system ${system.id}:`, error);
            chunkErrors++;
          } else {
            chunkUpdated += (count || 1);
          }
        } catch (systemError) {
          console.error(`Failed to update system ${system.id}:`, systemError);
          chunkErrors++;
        }
      }

      totalUpdated += chunkUpdated;
      totalErrors += chunkErrors;
      
      if (chunkUpdated > 0) {
        console.log(`Updated ${chunkUpdated}/${chunk.length} systems in chunk`);
      }
      if (chunkErrors > 0) {
        console.warn(`${chunkErrors} errors in chunk`);
      }

    } catch (error) {
      console.error(`Failed to process chunk starting at index ${i}:`, error);
      totalErrors += chunk.length;
    }
  }

  return { updated: totalUpdated, errors: totalErrors };
}

// Validation function to check rescaling quality
async function validateRescaledCoordinates(supabase: any): Promise<ValidationResult> {
  try {
    const { data: systems, error } = await supabase
      .from('galactic_systems')
      .select('coordinate_x, coordinate_y, coordinate_z')
      .not('coordinate_x', 'is', null)
      .not('coordinate_y', 'is', null)
      .not('coordinate_z', 'is', null)
      .limit(1000); // Sample for validation

    if (error) {
      return {
        valid: false,
        errors: [`Validation query failed: ${error.message}`],
        stats: { totalSystems: 0, validCoordinates: 0, duplicatePositions: 0, outOfRange: 0 }
      };
    }

    const errors: string[] = [];
    let outOfRange = 0;
    let duplicatePositions = 0;
    const positions = new Set<string>();

    for (const system of systems) {
      const { coordinate_x: x, coordinate_y: y, coordinate_z: z } = system;
      
      // Check range
      if (Math.abs(x) > TARGET_SCALE || Math.abs(y) > TARGET_SCALE || Math.abs(z) > TARGET_SCALE) {
        outOfRange++;
      }

      // Check for duplicates (rounded to nearest 100 for reasonable tolerance)
      const posKey = `${Math.round(x/100)},${Math.round(y/100)},${Math.round(z/100)}`;
      if (positions.has(posKey)) {
        duplicatePositions++;
      } else {
        positions.add(posKey);
      }
    }

    if (outOfRange > systems.length * 0.01) { // More than 1% out of range
      errors.push(`${outOfRange} systems have coordinates outside target range`);
    }

    if (duplicatePositions > systems.length * 0.05) { // More than 5% duplicates
      errors.push(`${duplicatePositions} systems have very similar positions`);
    }

    return {
      valid: errors.length === 0,
      errors,
      stats: {
        totalSystems: systems.length,
        validCoordinates: systems.length - outOfRange,
        duplicatePositions,
        outOfRange
      }
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Validation failed: ${error.message}`],
      stats: { totalSystems: 0, validCoordinates: 0, duplicatePositions: 0, outOfRange: 0 }
    };
  }
}