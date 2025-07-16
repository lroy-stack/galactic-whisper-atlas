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
const BATCH_SIZE = 50;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧹 Starting coordinate cleanup process');

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // First, count total systems to clean
    const { count: totalSystems, error: countError } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .not('coordinate_x', 'is', null);

    if (countError) {
      console.error('❌ Error counting systems:', countError);
      throw countError;
    }

    const systemsToClean = totalSystems || 0;
    console.log(`📊 Found ${systemsToClean} systems with coordinates to clean`);

    let processedSystems = 0;
    let offset = 0;
    const results = [];

    // Process in batches for progress tracking
    while (processedSystems < systemsToClean) {
      const batchStart = Date.now();
      
      // Get batch of systems with coordinates
      const { data: systemsBatch, error: fetchError } = await supabase
        .from('galactic_systems')
        .select('id, name')
        .not('coordinate_x', 'is', null)
        .range(offset, offset + BATCH_SIZE - 1);

      if (fetchError) {
        console.error('❌ Error fetching systems batch:', fetchError);
        throw fetchError;
      }

      if (!systemsBatch || systemsBatch.length === 0) {
        break;
      }

      // Clear coordinates for this batch
      const systemIds = systemsBatch.map(s => s.id);
      const { error: clearError, count: clearedCount } = await supabase
        .from('galactic_systems')
        .update({
          coordinate_x: null,
          coordinate_y: null,
          coordinate_z: null
        })
        .in('id', systemIds);

      if (clearError) {
        console.error('❌ Error clearing coordinates:', clearError);
        throw clearError;
      }

      processedSystems += systemsBatch.length;
      offset += BATCH_SIZE;

      const batchTime = Date.now() - batchStart;
      const progress = Math.min(100, (processedSystems / systemsToClean) * 100);

      results.push({
        batch: Math.floor(offset / BATCH_SIZE),
        processed: systemsBatch.length,
        cleared: clearedCount || 0,
        totalProcessed: processedSystems,
        progress: Math.round(progress),
        timeMs: batchTime
      });

      console.log(`✅ Batch ${Math.floor(offset / BATCH_SIZE)}: Cleared ${clearedCount} systems (${progress.toFixed(1)}% complete)`);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final verification - count remaining systems with coordinates
    const { count: remainingSystems } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .not('coordinate_x', 'is', null);

    console.log(`✅ Cleanup complete! Processed ${processedSystems} systems, ${remainingSystems || 0} systems still have coordinates`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully cleared coordinates from ${processedSystems} systems`,
        totalProcessed: processedSystems,
        systemsToClean,
        remainingSystems: remainingSystems || 0,
        isComplete: (remainingSystems || 0) === 0,
        batches: results,
        summary: {
          startedWith: systemsToClean,
          processed: processedSystems,
          remaining: remainingSystems || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in clear-galactic-coordinates function:', error);
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