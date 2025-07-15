import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RelationshipData {
  system_a: string;
  system_b: string;
  relationship_type: string;
  strength: number;
  description: string;
  trade_volume_credits?: number;
  military_cooperation?: boolean;
  cultural_exchange?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { relationships } = await req.json();

    if (!relationships || !Array.isArray(relationships)) {
      throw new Error('Invalid relationships data');
    }

    console.log(`💾 Saving ${relationships.length} relationships to database`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const relationship of relationships as RelationshipData[]) {
      try {
        // Check if relationship already exists (bidirectional)
        const { data: existing } = await supabase
          .from('system_relationships')
          .select('id')
          .or(`and(system_a_id.eq.${relationship.system_a},system_b_id.eq.${relationship.system_b}),and(system_a_id.eq.${relationship.system_b},system_b_id.eq.${relationship.system_a})`)
          .single();

        if (existing) {
          // Update existing relationship
          const { error: updateError } = await supabase
            .from('system_relationships')
            .update({
              relationship_type: relationship.relationship_type,
              strength: relationship.strength,
              description: relationship.description,
              trade_volume_credits: relationship.trade_volume_credits,
              military_cooperation: relationship.military_cooperation,
              cultural_exchange: relationship.cultural_exchange,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`🔄 Updated existing relationship: ${existing.id}`);
        } else {
          // Insert new relationship
          const { error: insertError } = await supabase
            .from('system_relationships')
            .insert({
              system_a_id: relationship.system_a,
              system_b_id: relationship.system_b,
              relationship_type: relationship.relationship_type,
              strength: relationship.strength,
              description: relationship.description,
              trade_volume_credits: relationship.trade_volume_credits,
              military_cooperation: relationship.military_cooperation,
              cultural_exchange: relationship.cultural_exchange
            });

          if (insertError) {
            throw insertError;
          }

          console.log(`✅ Inserted new relationship: ${relationship.system_a} ↔ ${relationship.system_b}`);
        }

        successCount++;
        results.push({
          success: true,
          relationship: `${relationship.system_a} ↔ ${relationship.system_b}`,
          type: relationship.relationship_type
        });

      } catch (relationshipError) {
        console.error(`❌ Error saving relationship:`, relationshipError);
        errorCount++;
        results.push({
          success: false,
          relationship: `${relationship.system_a} ↔ ${relationship.system_b}`,
          error: relationshipError.message
        });
      }
    }

    console.log(`🎯 Save complete: ${successCount} successful, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      totalProcessed: relationships.length,
      successCount,
      errorCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in save-system-relationships function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});