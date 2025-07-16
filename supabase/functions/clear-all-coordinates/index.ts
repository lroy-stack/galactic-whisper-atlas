// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import Supabase client for Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting coordinate cleanup process');

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Clear all 3D coordinates
    const { error: clearError, count } = await supabase
      .from('galactic_systems')
      .update({
        coordinate_x: null,
        coordinate_y: null,
        coordinate_z: null
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (clearError) {
      console.error('❌ Error clearing coordinates:', clearError);
      throw clearError;
    }

    console.log(`✅ Successfully cleared 3D coordinates for ${count || 'all'} systems`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleared 3D coordinates for ${count || 'all'} systems`,
        clearedSystems: count
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in clear-all-coordinates function:', error);
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