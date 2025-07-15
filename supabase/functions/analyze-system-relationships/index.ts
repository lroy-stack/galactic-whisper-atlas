import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SystemData {
  id: string;
  name: string;
  region: string;
  sector: string;
  significance: string;
  description: string;
  classification: string;
  coordinate_x: number;
  coordinate_y: number;
  coordinate_z: number;
}

interface RelationshipAnalysis {
  system_a: string;
  system_b: string;
  relationship_type: 'allied' | 'trade_partner' | 'dependent' | 'rival' | 'neutral' | 'enemy' | 'vassal';
  strength: number;
  description: string;
  trade_volume_credits?: number;
  military_cooperation?: boolean;
  cultural_exchange?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 10, forceReanalysis = false } = await req.json();

    console.log(`🚀 Starting relationship analysis (batch: ${batchSize}, force: ${forceReanalysis})`);

    // Get all systems with their data
    const { data: systems, error: systemsError } = await supabase
      .from('galactic_systems')
      .select('id, name, region, sector, significance, description, classification, coordinate_x, coordinate_y, coordinate_z')
      .not('description', 'is', null)
      .limit(batchSize);

    if (systemsError) {
      throw systemsError;
    }

    if (!systems || systems.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No systems found for analysis',
        relationships: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Analyzing relationships for ${systems.length} systems`);

    const relationships: RelationshipAnalysis[] = [];
    let totalProcessed = 0;
    let totalSaved = 0;

    // Create array of all possible system pairs
    const systemPairs: [SystemData, SystemData][] = [];
    for (let i = 0; i < systems.length; i++) {
      for (let j = i + 1; j < systems.length; j++) {
        systemPairs.push([systems[i] as SystemData, systems[j] as SystemData]);
      }
    }

    console.log(`📊 Total pairs to analyze: ${systemPairs.length}`);

    // Process pairs in batches of 5
    const processingBatchSize = 5;
    for (let batchStart = 0; batchStart < systemPairs.length; batchStart += processingBatchSize) {
      const currentBatch = systemPairs.slice(batchStart, batchStart + processingBatchSize);
      const batchNumber = Math.floor(batchStart / processingBatchSize) + 1;
      const totalBatches = Math.ceil(systemPairs.length / processingBatchSize);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${currentBatch.length} pairs)`);

      const batchRelationships: RelationshipAnalysis[] = [];

      // Analyze relationships in current batch
      for (const [systemA, systemB] of currentBatch) {
        console.log(`🔍 Analyzing relationship: ${systemA.name} ↔ ${systemB.name}`);

        // Check if relationship already exists
        if (!forceReanalysis) {
          const { data: existingRelation } = await supabase
            .from('system_relationships')
            .select('id')
            .or(`and(system_a_id.eq.${systemA.id},system_b_id.eq.${systemB.id}),and(system_a_id.eq.${systemB.id},system_b_id.eq.${systemA.id})`)
            .maybeSingle();

          if (existingRelation) {
            console.log(`⏭️ Relationship already exists, skipping`);
            totalProcessed++;
            continue;
          }
        }

        // Calculate distance between systems
        const distance = calculateDistance(systemA, systemB);
        
        // Prepare context for AI analysis
        const analysisPrompt = `
Analyze the relationship between these two galactic systems and determine their political, economic, and strategic connections:

SYSTEM A: ${systemA.name}
Region: ${systemA.region}
Sector: ${systemA.sector || 'Unknown'}
Classification: ${systemA.classification || 'Unknown'}
Significance: ${systemA.significance || 'Unknown'}
Description: ${systemA.description || 'No description available'}

SYSTEM B: ${systemB.name}
Region: ${systemB.region}
Sector: ${systemB.sector || 'Unknown'}
Classification: ${systemB.classification || 'Unknown'}
Significance: ${systemB.significance || 'Unknown'}
Description: ${systemB.description || 'No description available'}

Distance: ${distance.toFixed(2)} light-years

Based on the descriptions, significance, proximity, and known Star Wars lore, determine their relationship type:
- ALLIED: Strong political or military alliance
- TRADE_PARTNER: Primarily economic relationship
- DEPENDENT: One depends on the other for resources/protection
- RIVAL: Competing interests or conflicts
- ENEMY: Active hostility or warfare
- VASSAL: One system subordinate to another
- NEUTRAL: No significant relationship

Provide a JSON response with:
{
  "relationship_type": "one of the above types",
  "strength": 1-10 (relationship intensity),
  "description": "brief explanation of the relationship",
  "trade_volume_credits": estimated annual trade in billions (if trade relationship),
  "military_cooperation": true/false,
  "cultural_exchange": true/false
}
`;

        try {
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
                  content: 'You are an expert in Star Wars galactic politics and economics. Analyze system relationships based on canon lore, geographic proximity, and economic/political factors. Always respond with valid JSON.'
                },
                {
                  role: 'user',
                  content: analysisPrompt
                }
              ],
              temperature: 0.3,
              max_tokens: 500
            }),
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const aiResult = await response.json();
          const aiContent = aiResult.choices[0]?.message?.content;

          if (!aiContent) {
            throw new Error('No content from OpenAI');
          }

          console.log(`🤖 AI analysis for ${systemA.name} ↔ ${systemB.name}:`, aiContent);

          // Clean and parse AI response (handle markdown formatting)
          let cleanContent = aiContent.trim();
          if (cleanContent.startsWith('```json')) {
            cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          const relationshipData = JSON.parse(cleanContent);

          // Validate and sanitize the relationship data
          const relationship: RelationshipAnalysis = {
            system_a: systemA.id,
            system_b: systemB.id,
            relationship_type: relationshipData.relationship_type.toLowerCase(),
            strength: Math.max(1, Math.min(10, relationshipData.strength || 1)),
            description: relationshipData.description || `Relationship between ${systemA.name} and ${systemB.name}`,
            trade_volume_credits: relationshipData.trade_volume_credits || null,
            military_cooperation: relationshipData.military_cooperation || false,
            cultural_exchange: relationshipData.cultural_exchange || false
          };

          batchRelationships.push(relationship);
          
          console.log(`✅ Analyzed relationship: ${systemA.name} ↔ ${systemB.name} (${relationship.relationship_type}, strength: ${relationship.strength})`);

        } catch (aiError) {
          console.error(`❌ Error analyzing ${systemA.name} ↔ ${systemB.name}:`, aiError);
          
          // Create a neutral relationship as fallback
          const fallbackRelationship: RelationshipAnalysis = {
            system_a: systemA.id,
            system_b: systemB.id,
            relationship_type: 'neutral',
            strength: 3,
            description: `Geographic proximity relationship between ${systemA.name} and ${systemB.name}. Distance: ${distance.toFixed(2)} light-years.`,
            trade_volume_credits: null,
            military_cooperation: false,
            cultural_exchange: false
          };
          
          batchRelationships.push(fallbackRelationship);
          console.log(`⚠️ Used fallback relationship for ${systemA.name} ↔ ${systemB.name}`);
        }

        totalProcessed++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Save batch relationships to database
      if (batchRelationships.length > 0) {
        const relationshipInserts = batchRelationships.map(r => ({
          system_a_id: r.system_a,
          system_b_id: r.system_b,
          relationship_type: r.relationship_type,
          strength: r.strength,
          description: r.description,
          trade_volume_credits: r.trade_volume_credits,
          military_cooperation: r.military_cooperation,
          cultural_exchange: r.cultural_exchange
        }));

        const { error: insertError } = await supabase
          .from('system_relationships')
          .insert(relationshipInserts);

        if (insertError) {
          console.error('❌ Error inserting batch relationships:', insertError);
          throw new Error(`Failed to save batch relationships: ${insertError.message}`);
        }

        totalSaved += batchRelationships.length;
        relationships.push(...batchRelationships);
        console.log(`💾 Batch ${batchNumber}: Saved ${batchRelationships.length} relationships (Total saved: ${totalSaved})`);
      }

      // Longer delay between batches
      if (batchStart + processingBatchSize < systemPairs.length) {
        console.log(`⏸️ Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`🎯 Analysis complete: ${relationships.length} relationships processed, ${totalSaved} saved to database`);

    return new Response(JSON.stringify({
      success: true,
      relationshipsAnalyzed: relationships.length,
      totalSystemsProcessed: systems.length,
      relationshipsSaved: relationships.length,
      relationships: relationships.map(r => ({
        system_a_name: systems.find(s => s.id === r.system_a)?.name,
        system_b_name: systems.find(s => s.id === r.system_b)?.name,
        relationship_type: r.relationship_type,
        strength: r.strength,
        description: r.description,
        trade_volume_credits: r.trade_volume_credits,
        military_cooperation: r.military_cooperation,
        cultural_exchange: r.cultural_exchange
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in analyze-system-relationships function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateDistance(systemA: SystemData, systemB: SystemData): number {
  const dx = (systemA.coordinate_x || 0) - (systemB.coordinate_x || 0);
  const dy = (systemA.coordinate_y || 0) - (systemB.coordinate_y || 0);
  const dz = (systemA.coordinate_z || 0) - (systemB.coordinate_z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}