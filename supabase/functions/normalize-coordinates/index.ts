// CORS headers for web app requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const BATCH_SIZE = 50; // Same as successful original function
const TARGET_X_Y_RANGE = 750000; // ±750K for X/Y coordinates
const TARGET_Z_RANGE = 50000;    // ±50K for Z coordinates

interface System {
  id: string;
  name: string;
  coordinate_x: number;
  coordinate_y: number;
  coordinate_z: number;
}

// Normalize coordinate to target range while preserving proportions
function normalizeCoordinate(coord: number, maxRange: number): number {
  if (Math.abs(coord) <= maxRange) {
    return coord; // Already within range
  }
  
  const sign = coord >= 0 ? 1 : -1;
  const normalized = Math.min(Math.abs(coord), maxRange);
  return sign * normalized;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting coordinate normalization process...');
    
    // Get Supabase configuration from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log(`Processing batch starting at offset: ${offset}`);

    // Fetch systems that are out of range and need normalization
    const { data: systems, error: fetchError } = await supabase
      .from('galactic_systems')
      .select('id, name, coordinate_x, coordinate_y, coordinate_z')
      .not('coordinate_x', 'is', null)
      .not('coordinate_y', 'is', null)
      .not('coordinate_z', 'is', null)
      .or(`abs(coordinate_x).gt.${TARGET_X_Y_RANGE},abs(coordinate_y).gt.${TARGET_X_Y_RANGE},abs(coordinate_z).gt.${TARGET_Z_RANGE}`)
      .range(offset, offset + BATCH_SIZE - 1)
      .order('id');

    if (fetchError) {
      console.error('Error fetching systems:', fetchError);
      throw fetchError;
    }

    if (!systems || systems.length === 0) {
      console.log('No more systems need normalization');
      return new Response(JSON.stringify({
        success: true,
        message: 'Coordinate normalization completed',
        processedSystems: 0,
        updatedSystems: 0,
        errors: 0,
        hasMore: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${systems.length} systems needing normalization`);

    let processedSystems = 0;
    let updatedSystems = 0;
    let errors = 0;

    // Process each system individually (same pattern as original function)
    for (const system of systems) {
      try {
        processedSystems++;
        
        // Check if system actually needs normalization
        const needsNormalization = 
          Math.abs(system.coordinate_x) > TARGET_X_Y_RANGE ||
          Math.abs(system.coordinate_y) > TARGET_X_Y_RANGE ||
          Math.abs(system.coordinate_z) > TARGET_Z_RANGE;

        if (!needsNormalization) {
          console.log(`System ${system.name} already within target ranges, skipping`);
          continue;
        }

        // Apply normalization
        const normalizedX = normalizeCoordinate(system.coordinate_x, TARGET_X_Y_RANGE);
        const normalizedY = normalizeCoordinate(system.coordinate_y, TARGET_X_Y_RANGE);
        const normalizedZ = normalizeCoordinate(system.coordinate_z, TARGET_Z_RANGE);

        console.log(`Normalizing ${system.name}: (${system.coordinate_x}, ${system.coordinate_y}, ${system.coordinate_z}) -> (${normalizedX}, ${normalizedY}, ${normalizedZ})`);

        // Update the system with normalized coordinates
        const { error: updateError } = await supabase
          .from('galactic_systems')
          .update({
            coordinate_x: normalizedX,
            coordinate_y: normalizedY,
            coordinate_z: normalizedZ,
            updated_at: new Date().toISOString()
          })
          .eq('id', system.id);

        if (updateError) {
          console.error(`Failed to update system ${system.name}:`, updateError);
          errors++;
        } else {
          console.log(`Successfully normalized coordinates for system: ${system.name}`);
          updatedSystems++;
        }

      } catch (systemError) {
        console.error(`Error processing system ${system.name}:`, systemError);
        errors++;
      }
    }

    // Check if there are more systems to process
    const { data: nextBatch, error: nextError } = await supabase
      .from('galactic_systems')
      .select('id', { count: 'exact', head: true })
      .not('coordinate_x', 'is', null)
      .not('coordinate_y', 'is', null)
      .not('coordinate_z', 'is', null)
      .or(`abs(coordinate_x).gt.${TARGET_X_Y_RANGE},abs(coordinate_y).gt.${TARGET_X_Y_RANGE},abs(coordinate_z).gt.${TARGET_Z_RANGE}`)
      .range(offset + BATCH_SIZE, offset + BATCH_SIZE);

    const hasMore = !nextError && nextBatch && Array.isArray(nextBatch) && nextBatch.length > 0;

    const result = {
      success: true,
      message: `Processed ${processedSystems} systems, normalized ${updatedSystems} coordinates`,
      processedSystems,
      updatedSystems,
      errors,
      hasMore,
      nextOffset: hasMore ? offset + BATCH_SIZE : null,
      details: {
        targetRanges: {
          xy: `±${TARGET_X_Y_RANGE}`,
          z: `±${TARGET_Z_RANGE}`
        },
        currentBatch: {
          offset,
          size: systems.length
        }
      }
    };

    console.log('Batch completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Coordinate normalization error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Failed to normalize coordinates'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});