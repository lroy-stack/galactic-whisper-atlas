import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regional scaling configuration - MASSIVE galactic scale
const REGION_CONFIG = {
  'Deep Core': { maxRadius: 150000, priority: 1 },
  'Core Worlds': { maxRadius: 250000, priority: 2 },
  'Colonies': { maxRadius: 500000, priority: 3 },
  'Inner Rim': { maxRadius: 500000, priority: 3 },
  'Expansion Region': { maxRadius: 1000000, priority: 4 },
  'Mid Rim': { maxRadius: 1000000, priority: 4 },
  'Outer Rim': { maxRadius: 1800000, priority: 5 },
  'Wild Space': { maxRadius: 2000000, priority: 6 },
  'Unknown Regions': { maxRadius: 2000000, priority: 6 }
};

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

    // Process systems in batches
    const processBatchSize = 800; // Fetch batch size
    const updateBatchSize = 25; // Update batch size
    let totalUpdated = 0;
    let batchNumber = 0;

    for (let offset = 0; offset < totalCount; offset += processBatchSize) {
      batchNumber++;
      console.log(`Processing batch ${batchNumber}/${Math.ceil(totalCount / processBatchSize)} (offset: ${offset})`);

      // Fetch batch of systems
      const { data: systemBatch, error: fetchError } = await supabase
        .from('galactic_systems')
        .select('id, name, region, coordinate_x, coordinate_y, coordinate_z, grid_coordinates')
        .not('coordinate_x', 'is', null)
        .not('coordinate_y', 'is', null)
        .not('coordinate_z', 'is', null)
        .range(offset, offset + processBatchSize - 1);

      if (fetchError) {
        console.error(`Failed to fetch batch at offset ${offset}:`, fetchError);
        continue;
      }

      if (!systemBatch || systemBatch.length === 0) {
        console.log(`No more systems at offset ${offset}`);
        break;
      }

      // Rescale this batch
      const rescaledBatch = rescaleSystems(systemBatch as System[], bounds, galacticCenter, regionCenters);
      console.log(`Rescaled ${rescaledBatch.length} systems in batch ${batchNumber}`);

      // Update in smaller sub-batches
      for (let i = 0; i < rescaledBatch.length; i += updateBatchSize) {
        const updateBatch = rescaledBatch.slice(i, i + updateBatchSize);
        
        for (const system of updateBatch) {
          const { error: updateError } = await supabase
            .from('galactic_systems')
            .update({
              coordinate_x: system.coordinate_x,
              coordinate_y: system.coordinate_y,
              coordinate_z: system.coordinate_z,
              updated_at: new Date().toISOString()
            })
            .eq('id', system.id);

          if (updateError) {
            console.error(`Failed to update system ${system.name}:`, updateError);
          } else {
            totalUpdated++;
          }
        }

        // Log progress for updates within this batch
        const updateBatchNum = Math.floor(i / updateBatchSize) + 1;
        const totalUpdateBatches = Math.ceil(rescaledBatch.length / updateBatchSize);
        console.log(`Updated sub-batch ${updateBatchNum}/${totalUpdateBatches} in batch ${batchNumber}`);
      }

      console.log(`Completed batch ${batchNumber}, total updated so far: ${totalUpdated}`);
      
      // Add a small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully rescaled coordinates for ${totalUpdated} systems`,
      details: {
        totalSystems: totalCount,
        updatedSystems: totalUpdated,
        originalBounds: bounds,
        galacticCenter: galacticCenter,
        regionCenters: Object.keys(regionCenters)
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

function rescaleSystems(
  systems: System[], 
  bounds: Bounds, 
  galacticCenter: { x: number; y: number; z: number },
  regionCenters: Record<string, RegionCenter>
): System[] {
  const rescaled: System[] = [];
  
  // MASSIVE EXPANSION FACTOR: x50,000 total expansion
  const expansionFactor = 50000;
  
  // Track used positions to ensure minimum separation (galactic scale)
  const usedPositions: { x: number; y: number; z: number }[] = [];
  const minSeparation = 5000; // Massive separation for true galactic scale

  for (const system of systems) {
    if (system.coordinate_x === null || system.coordinate_y === null || system.coordinate_z === null) {
      rescaled.push(system);
      continue;
    }

    // Get region configuration
    const regionConfig = REGION_CONFIG[system.region] || REGION_CONFIG['Unknown Regions'];
    const regionCenter = regionCenters[system.region] || galacticCenter;

    // EXPAND coordinates by the expansion factor (50x minimum)
    let x = (system.coordinate_x - galacticCenter.x) * expansionFactor;
    let y = (system.coordinate_y - galacticCenter.y) * expansionFactor;
    let z = (system.coordinate_z - galacticCenter.z) * expansionFactor;

    // Apply region-based scaling
    const distanceFromRegionCenter = Math.sqrt(
      Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2)
    );

    if (distanceFromRegionCenter > regionConfig.maxRadius) {
      const scale = regionConfig.maxRadius / distanceFromRegionCenter;
      x *= scale;
      y *= scale;
      z *= scale;
    }

    // Ensure minimum separation from other systems
    let finalX = x, finalY = y, finalZ = z;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const tooClose = usedPositions.some(pos => {
        const distance = Math.sqrt(
          Math.pow(finalX - pos.x, 2) + 
          Math.pow(finalY - pos.y, 2) + 
          Math.pow(finalZ - pos.z, 2)
        );
        return distance < minSeparation;
      });

      if (!tooClose) break;

      // Add massive random offset to avoid collision at true galactic scale
      const angle = Math.random() * 2 * Math.PI;
      const offset = minSeparation * (1 + Math.random() * 5);
      finalX = x + Math.cos(angle) * offset;
      finalY = y + Math.sin(angle) * offset;
      finalZ = z + (Math.random() - 0.5) * offset * 3;
      
      attempts++;
    }

    usedPositions.push({ x: finalX, y: finalY, z: finalZ });

    rescaled.push({
      ...system,
      coordinate_x: Number(finalX.toFixed(2)),
      coordinate_y: Number(finalY.toFixed(2)),
      coordinate_z: Number(finalZ.toFixed(2))
    });
  }

  return rescaled;
}