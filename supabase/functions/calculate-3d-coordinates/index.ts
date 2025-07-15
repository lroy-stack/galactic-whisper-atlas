import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 3D Galactic Coordinate System Functions
interface GalacticCoordinates3D {
  x: number;
  y: number;
  z: number;
}

interface RegionZBounds {
  min: number;
  max: number;
}

// Z-axis bounds for different galactic regions (in light-years)
const REGION_Z_BOUNDS: Record<string, RegionZBounds> = {
  'Core Worlds': { min: -2500, max: 2500 },
  'Colonies': { min: -5000, max: 5000 },
  'Inner Rim': { min: -6000, max: 6000 },
  'Expansion Region': { min: -7000, max: 7000 },
  'Mid Rim': { min: -7500, max: 7500 },
  'Outer Rim': { min: -12500, max: 12500 },
  'Wild Space': { min: -20000, max: 20000 },
  'Unknown Regions': { min: -20000, max: 20000 },
  'Hutt Space': { min: -10000, max: 10000 },
  'Corporate Sector': { min: -8000, max: 8000 }
};

const DEFAULT_Z_BOUNDS: RegionZBounds = { min: -15000, max: 15000 };

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

function letterToX(letter: string): number {
  const charCode = letter.charCodeAt(0) - 65;
  const normalizedPosition = (charCode / 25) * 2 - 1;
  return normalizedPosition * 65000;
}

function numberToY(number: number): number {
  const normalizedPosition = ((number - 1) / 23) * 2 - 1;
  return normalizedPosition * 60000;
}

function calculateZ(
  region: string,
  systemName: string,
  population?: number,
  classification?: string
): number {
  const bounds = REGION_Z_BOUNDS[region] || DEFAULT_Z_BOUNDS;
  
  const seed = hashString(systemName + region);
  const baseRandom = seededRandom(seed);
  
  let z = bounds.min + (bounds.max - bounds.min) * baseRandom;
  
  if (population && population > 0) {
    const populationFactor = Math.min(Math.log10(population) / 12, 1);
    const centeringEffect = (1 - populationFactor) * 0.3;
    z *= (1 - centeringEffect);
  }
  
  if (classification) {
    const centralizedTypes = ['Capital', 'Trade Hub', 'Industrial', 'Core World'];
    const frontierTypes = ['Frontier', 'Mining', 'Agricultural', 'Backwater'];
    
    if (centralizedTypes.some(type => classification.includes(type))) {
      z *= 0.7;
    } else if (frontierTypes.some(type => classification.includes(type))) {
      z *= 1.3;
    }
  }
  
  const noiseSeed = hashString(systemName + 'noise');
  const noise = (seededRandom(noiseSeed) - 0.5) * 0.2;
  z *= (1 + noise);
  
  return Math.max(bounds.min, Math.min(bounds.max, z));
}

function galacticCoordinatesToXYZ(
  gridCoordinates: string,
  region: string,
  systemName: string,
  population?: number,
  classification?: string
): GalacticCoordinates3D | null {
  const parsed = parseGridCoordinates(gridCoordinates);
  if (!parsed) return null;
  
  const x = letterToX(parsed.letter);
  const y = numberToY(parsed.number);
  const z = calculateZ(region, systemName, population, classification);
  
  return { x, y, z };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 50, offset = 0 } = await req.json();

    console.log(`🚀 Starting 3D coordinate calculation (batch: ${batchSize}, offset: ${offset})`);

    // Get systems that need 3D coordinates calculated
    const { data: systems, error: fetchError } = await supabase
      .from('galactic_systems')
      .select('id, name, region, grid_coordinates, population, classification, coordinate_x, coordinate_y, coordinate_z')
      .not('grid_coordinates', 'is', null)
      .or('coordinate_x.is.null,coordinate_y.is.null,coordinate_z.is.null')
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error('Error fetching systems:', fetchError);
      throw fetchError;
    }

    if (!systems || systems.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No more systems need coordinate calculation',
        completed: 0,
        total: 0,
        hasMore: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📍 Processing ${systems.length} systems for 3D coordinates`);

    const updatedSystems = [];
    let successful = 0;
    let errors = 0;

    for (const system of systems) {
      try {
        // Skip if already has all coordinates
        if (system.coordinate_x !== null && system.coordinate_y !== null && system.coordinate_z !== null) {
          console.log(`⏭️ Skipping ${system.name} - already has 3D coordinates`);
          continue;
        }

        console.log(`🔄 Calculating coordinates for: ${system.name} (${system.grid_coordinates})`);

        const coords = galacticCoordinatesToXYZ(
          system.grid_coordinates,
          system.region,
          system.name,
          system.population,
          system.classification
        );

        if (!coords) {
          console.error(`❌ Invalid grid coordinates for ${system.name}: ${system.grid_coordinates}`);
          errors++;
          continue;
        }

        // Update the system with 3D coordinates
        const { error: updateError } = await supabase
          .from('galactic_systems')
          .update({
            coordinate_x: coords.x,
            coordinate_y: coords.y,
            coordinate_z: coords.z,
            updated_at: new Date().toISOString()
          })
          .eq('id', system.id);

        if (updateError) {
          console.error(`❌ Failed to update coordinates for ${system.name}:`, updateError);
          errors++;
          continue;
        }

        updatedSystems.push({
          id: system.id,
          name: system.name,
          region: system.region,
          grid_coordinates: system.grid_coordinates,
          coordinates: coords
        });

        successful++;
        console.log(`✅ Updated ${system.name}: X=${coords.x.toFixed(0)}, Y=${coords.y.toFixed(0)}, Z=${coords.z.toFixed(0)} ly`);

      } catch (error) {
        console.error(`❌ Error processing ${system.name}:`, error);
        errors++;
      }
    }

    // Check if there are more systems to process
    const { count } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .not('grid_coordinates', 'is', null)
      .or('coordinate_x.is.null,coordinate_y.is.null,coordinate_z.is.null');

    const hasMore = (count || 0) > offset + batchSize;

    console.log(`🎯 Coordinate calculation complete: ${successful} successful, ${errors} errors`);

    return new Response(JSON.stringify({
      success: true,
      completed: successful,
      errors,
      total: systems.length,
      hasMore,
      nextOffset: offset + batchSize,
      updatedSystems
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in calculate-3d-coordinates function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});