import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('🧪 Starting relationship system test...');

    // Test 1: Environment check
    const envCheck = {
      hasOpenAIKey: !!openAIApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      openaiKeyLength: openAIApiKey?.length || 0
    };

    console.log('Environment check:', JSON.stringify(envCheck));

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test 2: Database connectivity and data availability
    console.log('📊 Checking database connectivity...');
    
    const { data: systems, error: systemsError, count } = await supabase
      .from('galactic_systems')
      .select('id, name, region, description, coordinate_x, coordinate_y, coordinate_z', { count: 'exact' })
      .not('description', 'is', null)
      .limit(5);

    if (systemsError) {
      throw new Error(`Database error: ${systemsError.message}`);
    }

    console.log(`✅ Found ${count} systems with descriptions`);
    console.log(`🔍 Sample systems:`, systems?.map(s => s.name).join(', '));

    // Test 3: Check existing relationships
    const { data: existingRelationships, error: relationshipsError, count: relationshipsCount } = await supabase
      .from('system_relationships')
      .select('*', { count: 'exact' })
      .limit(3);

    if (relationshipsError) {
      console.warn('⚠️ Warning checking relationships:', relationshipsError.message);
    } else {
      console.log(`📈 Found ${relationshipsCount} existing relationships`);
    }

    // Test 4: OpenAI API connectivity
    console.log('🤖 Testing OpenAI API...');
    
    const testPrompt = "Test connection. Respond with exactly: {\"status\": \"connected\", \"message\": \"API working\"}";
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        temperature: 0,
        max_tokens: 50
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} - ${await response.text()}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices[0]?.message?.content;

    console.log('🤖 OpenAI response:', aiContent);

    let openaiStatus;
    try {
      openaiStatus = JSON.parse(aiContent);
    } catch {
      openaiStatus = { status: 'response_received', message: aiContent };
    }

    // Test 5: Sample relationship analysis (if we have enough systems)
    let sampleAnalysis = null;
    if (systems && systems.length >= 2) {
      console.log('🔍 Testing sample relationship analysis...');
      
      const systemA = systems[0];
      const systemB = systems[1];
      
      const distance = Math.sqrt(
        Math.pow((systemA.coordinate_x || 0) - (systemB.coordinate_x || 0), 2) +
        Math.pow((systemA.coordinate_y || 0) - (systemB.coordinate_y || 0), 2) +
        Math.pow((systemA.coordinate_z || 0) - (systemB.coordinate_z || 0), 2)
      );

      sampleAnalysis = {
        system_a: systemA.name,
        system_b: systemB.name,
        distance_ly: distance.toFixed(2),
        has_coordinates: !!(systemA.coordinate_x && systemB.coordinate_x),
        has_descriptions: !!(systemA.description && systemB.description)
      };

      console.log('📊 Sample analysis:', JSON.stringify(sampleAnalysis));
    }

    // Summary
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connected: true,
        systemsWithDescriptions: count,
        existingRelationships: relationshipsCount,
        sampleSystems: systems?.slice(0, 3).map(s => ({
          name: s.name,
          region: s.region,
          hasCoordinates: !!(s.coordinate_x && s.coordinate_y && s.coordinate_z),
          hasDescription: !!s.description
        }))
      },
      openai: {
        connected: true,
        status: openaiStatus
      },
      analysis: sampleAnalysis,
      recommendations: []
    };

    // Add recommendations based on test results
    if (count < 10) {
      testResults.recommendations.push('⚠️ Low number of systems with descriptions. Consider running data completion first.');
    }

    if (relationshipsCount > 100) {
      testResults.recommendations.push('💡 Many relationships exist. Consider using forceReanalysis=false to avoid duplicates.');
    }

    if (!systems?.some(s => s.coordinate_x && s.coordinate_y && s.coordinate_z)) {
      testResults.recommendations.push('📍 Some systems lack 3D coordinates. Distance calculations may be inaccurate.');
    }

    if (count > 50) {
      testResults.recommendations.push('🚀 Good dataset size! You can run full analysis with confidence.');
    }

    console.log('✅ Test completed successfully');

    return new Response(JSON.stringify(testResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});