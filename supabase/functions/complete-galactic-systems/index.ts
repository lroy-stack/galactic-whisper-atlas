import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 10, offset = 0 } = await req.json();

    // Get systems that need completion
    const { data: systems, error: fetchError } = await supabase
      .from('galactic_systems')
      .select('id, name, region')
      .is('description', null)
      .range(offset, offset + batchSize - 1)
      .order('name');

    if (fetchError) {
      throw new Error(`Failed to fetch systems: ${fetchError.message}`);
    }

    if (!systems || systems.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No more systems to complete',
        completed: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${systems.length} systems starting from offset ${offset}`);

    const completedSystems = [];

    for (const system of systems) {
      try {
        console.log(`Completing data for system: ${system.name}`);

        const prompt = `You are a Star Wars lore expert. Complete the missing information for the galactic system "${system.name}" located in the "${system.region}".

Generate realistic Star Wars data for this system in the following JSON format:

{
  "description": "A 2-3 sentence description of the system and its notable features",
  "population": number (total system population in billions, can be 0 for uninhabited systems),
  "classification": "Type of system (Industrial, Agricultural, Military, Trade Hub, Mining, Frontier, etc.)",
  "terrain": "Dominant terrain types (Desert, Forest, Ocean, Urban, Volcanic, etc.)",
  "species": ["Array of 1-4 species that inhabit this system"],
  "allegiance": "Political allegiance (Galactic Empire, Rebel Alliance, Hutt Space, Independent, etc.)",
  "significance": "Historical or strategic importance (1-2 sentences)"
}

Base the information on Star Wars canon when possible, but create plausible details for lesser-known systems. Make sure the data is consistent with the system's region (Core Worlds are usually more populated and developed, Outer Rim is more frontier-like, etc.).`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a Star Wars universe expert. Respond only with valid JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const aiResponse = await response.json();
        const content = aiResponse.choices[0]?.message?.content;

        if (!content) {
          throw new Error('No content received from OpenAI');
        }

        // Parse the JSON response
        const systemData = JSON.parse(content);

        // Update the system in Supabase
        const { error: updateError } = await supabase
          .from('galactic_systems')
          .update({
            description: systemData.description,
            population: systemData.population,
            classification: systemData.classification,
            terrain: systemData.terrain,
            species: systemData.species,
            allegiance: systemData.allegiance,
            significance: systemData.significance,
            updated_at: new Date().toISOString()
          })
          .eq('id', system.id);

        if (updateError) {
          console.error(`Failed to update system ${system.name}:`, updateError);
          continue;
        }

        completedSystems.push({
          name: system.name,
          region: system.region,
          ...systemData
        });

        console.log(`Successfully completed system: ${system.name}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing system ${system.name}:`, error);
        continue;
      }
    }

    // Check if there are more systems to process
    const { count } = await supabase
      .from('galactic_systems')
      .select('*', { count: 'exact', head: true })
      .is('description', null);

    const hasMore = (count || 0) > 0;

    return new Response(JSON.stringify({
      success: true,
      completedCount: completedSystems.length,
      totalProcessed: offset + completedSystems.length,
      hasMore,
      nextOffset: offset + batchSize,
      systems: completedSystems
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in complete-galactic-systems function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});