import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { systemName, enrichmentType } = await req.json();
    
    if (!systemName) {
      throw new Error('System name is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get system information
    const { data: system, error: systemError } = await supabase
      .from('galactic_systems')
      .select('*')
      .eq('name', systemName)
      .single();

    if (systemError || !system) {
      throw new Error(`System not found: ${systemName}`);
    }

    // Specialized prompts for different enrichment types
    const prompts = {
      planets: `You are C-3PO, expert in galactic geography. Generate detailed information for planets in the ${systemName} system in the ${system.region} region.

System info: ${JSON.stringify(system)}

Generate realistic Star Wars planets data. Return a JSON array of planets with this structure:
{
  "name": "Planet Name",
  "type": "terrestrial|gas_giant|ice_world|desert|ocean|volcanic|forest|urban|barren|asteroid",
  "climate": "temperate|tropical|arid|frozen|toxic|variable|artificial|unknown",
  "diameter_km": number,
  "gravity_standard": number (0.1 to 3.0),
  "atmosphere": "breathable|toxic|none|artificial",
  "hydrosphere_percentage": number (0-100),
  "day_length_hours": number,
  "year_length_days": number,
  "population": number,
  "government_type": "democratic|imperial|corporate|tribal|anarchic|unknown",
  "major_cities": ["city1", "city2"],
  "terrain": "description",
  "native_species": ["species1"],
  "imported_species": ["species2"],
  "flora_fauna": "description",
  "natural_resources": ["resource1", "resource2"],
  "technology_level": "primitive|basic|standard|advanced|highly_advanced",
  "trade_specialties": ["specialty1"],
  "notable_locations": ["location1"],
  "description": "detailed description"
}

Generate 2-4 planets that fit the system's characteristics.`,

      species: `You are C-3PO, expert in galactic species. Generate species information for the ${systemName} system.

System info: ${JSON.stringify(system)}

Generate realistic Star Wars species data. Return a JSON array with this structure:
{
  "name": "Species Name",
  "classification": "humanoid|mammalian|reptilian|avian|insectoid|silicon-based|energy-being",
  "average_height_cm": number,
  "average_lifespan_years": number,
  "language_family": "Basic|Binary|Other",
  "distinctive_features": "description",
  "culture_summary": "description",
  "force_sensitivity": "none|rare|common|strong",
  "notable_individuals": ["individual1"],
  "physical_description": "detailed description",
  "society_structure": "tribal|feudal|democratic|corporate|hive-mind",
  "technology_level": "primitive|basic|standard|advanced|highly_advanced"
}

Generate 1-3 species that would naturally inhabit this system.`,

      history: `You are C-3PO, expert in galactic history. Generate historical events for the ${systemName} system.

System info: ${JSON.stringify(system)}

Generate realistic Star Wars historical events. Return a JSON array with this structure:
{
  "name": "Event Name",
  "event_type": "battle|treaty|discovery|founding|destruction|liberation|occupation|rebellion",
  "start_date": "BBY/ABY format",
  "end_date": "BBY/ABY format or null",
  "participants": ["faction1", "faction2"],
  "outcome": "description",
  "significance": "local|regional|galactic",
  "description": "detailed description"
}

Generate 2-5 events that fit the system's importance and region.`,

      resources: `You are C-3PO, expert in galactic resources. Generate resource information for the ${systemName} system.

System info: ${JSON.stringify(system)}

Generate realistic Star Wars resources. Return a JSON array with this structure:
{
  "resource_name": "Resource Name",
  "resource_type": "mineral|energy|agricultural|technological|cultural|strategic",
  "abundance": "abundant|common|rare|extremely_rare",
  "extraction_difficulty": "easy|moderate|difficult|extremely_difficult",
  "market_value": "low|moderate|high|priceless",
  "controlled_by": "faction name",
  "annual_output": "description",
  "reserves_estimated": "description",
  "extraction_methods": ["method1"],
  "environmental_impact": "description"
}

Generate 3-6 resources that would be found in this system.`
    };

    const prompt = prompts[enrichmentType as keyof typeof prompts];
    if (!prompt) {
      throw new Error('Invalid enrichment type');
    }

    // Call OpenAI API
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
            content: 'You are C-3PO, an expert protocol droid with vast knowledge of galactic geography, species, history, and resources. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const enrichedData = JSON.parse(data.choices[0].message.content);

    // Store the enriched data in the appropriate table
    let insertResult;
    
    switch (enrichmentType) {
      case 'planets':
        insertResult = await supabase
          .from('planets')
          .insert(enrichedData.map((planet: any) => ({
            ...planet,
            system_id: system.id
          })));
        break;
        
      case 'species':
        insertResult = await supabase
          .from('species')
          .insert(enrichedData.map((species: any) => ({
            ...species,
            homeworld_id: system.id
          })));
        break;
        
      case 'history':
        insertResult = await supabase
          .from('historical_events')
          .insert(enrichedData.map((event: any) => ({
            ...event,
            system_id: system.id
          })));
        break;
        
      case 'resources':
        insertResult = await supabase
          .from('resources')
          .insert(enrichedData.map((resource: any) => ({
            ...resource,
            system_id: system.id
          })));
        break;
    }

    if (insertResult?.error) {
      console.error('Database insert error:', insertResult.error);
      throw new Error(`Failed to save ${enrichmentType}: ${insertResult.error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        enrichmentType, 
        systemName,
        data: enrichedData,
        message: `Successfully enriched ${systemName} with ${enrichmentType} data` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in galactic-enrichment function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});