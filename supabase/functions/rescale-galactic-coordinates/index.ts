import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regional scaling configuration
const REGION_CONFIG = {
  'Deep Core': { maxRadius: 15, priority: 1 },
  'Core Worlds': { maxRadius: 25, priority: 2 },
  'Colonies': { maxRadius: 50, priority: 3 },
  'Inner Rim': { maxRadius: 50, priority: 3 },
  'Expansion Region': { maxRadius: 100, priority: 4 },
  'Mid Rim': { maxRadius: 100, priority: 4 },
  'Outer Rim': { maxRadius: 180, priority: 5 },
  'Wild Space': { maxRadius: 200, priority: 6 },
  'Unknown Regions': { maxRadius: 200, priority: 6 }
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

    // Fetch all systems with coordinates
    const { data: systems, error: fetchError } = await supabase
      .from('galactic_systems')
      .select('id, name, region, coordinate_x, coordinate_y, coordinate_z, grid_coordinates')
      .not('coordinate_x', 'is', null)
      .not('coordinate_y', 'is', null)
      .not('coordinate_z', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch systems: ${fetchError.message}`);
    }

    if (!systems || systems.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No systems with coordinates found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Processing ${systems.length} systems...`);

    // Calculate current bounds
    const bounds = calculateBounds(systems as System[]);
    console.log('Current bounds:', bounds);

    // Calculate region centers of mass
    const regionCenters = calculateRegionCenters(systems as System[]);
    console.log('Region centers:', regionCenters);

    // Find galactic center (Core Worlds center of mass)
    const galacticCenter = regionCenters['Core Worlds'] || regionCenters['Deep Core'] || { x: 0, y: 0, z: 0 };
    console.log('Galactic center:', galacticCenter);

    // Rescale all systems
    const rescaledSystems = rescaleSystems(systems as System[], bounds, galacticCenter, regionCenters);
    console.log(`Rescaled ${rescaledSystems.length} systems`);

    // Update systems in batches
    const batchSize = 50;
    let updatedCount = 0;

    for (let i = 0; i < rescaledSystems.length; i += batchSize) {
      const batch = rescaledSystems.slice(i, i + batchSize);
      
      for (const system of batch) {
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
          updatedCount++;
        }
      }

      console.log(`Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rescaledSystems.length / batchSize)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully rescaled coordinates for ${updatedCount} systems`,
      details: {
        totalSystems: systems.length,
        updatedSystems: updatedCount,
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
  
  // Calculate scale factors to fit everything in -200 to +200 range
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  const rangeZ = bounds.maxZ - bounds.minZ;
  
  const maxRange = Math.max(rangeX, rangeY, rangeZ);
  const globalScale = 400 / maxRange; // Map to -200 to +200 range

  // Track used positions to ensure minimum separation
  const usedPositions: { x: number; y: number; z: number }[] = [];
  const minSeparation = 2.5;

  for (const system of systems) {
    if (system.coordinate_x === null || system.coordinate_y === null || system.coordinate_z === null) {
      rescaled.push(system);
      continue;
    }

    // Get region configuration
    const regionConfig = REGION_CONFIG[system.region] || REGION_CONFIG['Unknown Regions'];
    const regionCenter = regionCenters[system.region] || galacticCenter;

    // Normalize coordinates relative to galactic center
    let x = (system.coordinate_x - galacticCenter.x) * globalScale;
    let y = (system.coordinate_y - galacticCenter.y) * globalScale;
    let z = (system.coordinate_z - galacticCenter.z) * globalScale;

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

      // Add small random offset to avoid collision
      const angle = Math.random() * 2 * Math.PI;
      const offset = minSeparation * (1 + Math.random() * 0.5);
      finalX = x + Math.cos(angle) * offset;
      finalY = y + Math.sin(angle) * offset;
      finalZ = z + (Math.random() - 0.5) * offset;
      
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