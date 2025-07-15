import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface TradeRoute {
  name: string;
  origin_system_id: string;
  destination_system_id: string;
  route_type: string;
  safety_rating: number;
  primary_goods: string[];
  intermediate_systems: string[];
  controlling_faction: string;
  status: string;
  travel_time_days: number;
  established_date: string;
  description: string;
}

interface SystemData {
  id: string;
  name: string;
  region: string;
  sector: string;
  classification: string;
  allegiance: string;
  coordinate_x: number;
  coordinate_y: number;
  coordinate_z: number;
  description: string;
}

interface RelationshipData {
  system_a_id: string;
  system_b_id: string;
  relationship_type: string;
  strength: number;
  trade_volume_credits: number;
  description: string;
}

// Helper function to calculate distance between two systems
function calculateDistance(system1: SystemData, system2: SystemData): number {
  const dx = system1.coordinate_x - system2.coordinate_x;
  const dy = system1.coordinate_y - system2.coordinate_y;
  const dz = system1.coordinate_z - system2.coordinate_z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Helper function to determine safety rating based on region and allegiance
function determineSafetyRating(system1: SystemData, system2: SystemData): number {
  const coreWorlds = ['Core Worlds', 'Core', 'Deep Core'];
  const innerRim = ['Inner Rim', 'Inner Rim Territories'];
  const midRim = ['Mid Rim', 'Mid Rim Territories'];
  const outerRim = ['Outer Rim', 'Outer Rim Territories'];
  const unknownRegions = ['Unknown Regions', 'Wild Space'];

  const regions = [system1.region, system2.region];
  
  if (regions.some(r => coreWorlds.includes(r))) return 9;
  if (regions.some(r => innerRim.includes(r))) return 8;
  if (regions.some(r => midRim.includes(r))) return 7;
  if (regions.some(r => outerRim.includes(r))) return 5;
  if (regions.some(r => unknownRegions.includes(r))) return 3;
  
  return 6; // Default
}

// Helper function to determine primary goods based on system classifications
function determinePrimaryGoods(system1: SystemData, system2: SystemData): string[] {
  const goods: string[] = [];
  
  const classifications = [system1.classification, system2.classification].filter(Boolean);
  
  if (classifications.some(c => c?.toLowerCase().includes('agricultural'))) {
    goods.push('Agricultural Products', 'Food Supplies');
  }
  if (classifications.some(c => c?.toLowerCase().includes('industrial'))) {
    goods.push('Manufactured Goods', 'Machinery');
  }
  if (classifications.some(c => c?.toLowerCase().includes('mining'))) {
    goods.push('Raw Materials', 'Precious Metals');
  }
  if (classifications.some(c => c?.toLowerCase().includes('trade'))) {
    goods.push('Luxury Goods', 'Technology');
  }
  if (classifications.some(c => c?.toLowerCase().includes('financial'))) {
    goods.push('Financial Services', 'Information');
  }
  
  // Default goods if no specific classification
  if (goods.length === 0) {
    goods.push('General Merchandise', 'Consumer Goods');
  }
  
  return goods;
}

// Helper function to determine route type
function determineRouteType(distance: number, tradeVolume: number): string {
  if (tradeVolume > 10000000) return 'Major Trade Corridor';
  if (distance < 5000) return 'Regional Route';
  if (distance > 20000) return 'Long-Distance Route';
  return 'Standard Trade Route';
}

// Helper function to find intermediate systems
function findIntermediateSystems(
  origin: SystemData,
  destination: SystemData,
  allSystems: SystemData[],
  maxIntermediates: number = 3
): string[] {
  const distance = calculateDistance(origin, destination);
  if (distance < 10000) return []; // Short routes don't need intermediates
  
  const intermediates: SystemData[] = [];
  
  // Find systems that are roughly on the path between origin and destination
  for (const system of allSystems) {
    if (system.id === origin.id || system.id === destination.id) continue;
    
    const distToOrigin = calculateDistance(origin, system);
    const distToDestination = calculateDistance(system, destination);
    const totalDist = distToOrigin + distToDestination;
    
    // If the total distance through this system is not much longer than direct distance
    if (totalDist < distance * 1.3 && intermediates.length < maxIntermediates) {
      intermediates.push(system);
    }
  }
  
  // Sort by distance from origin and return names
  return intermediates
    .sort((a, b) => calculateDistance(origin, a) - calculateDistance(origin, b))
    .map(s => s.name);
}

// Helper function to generate AI description
async function generateRouteDescription(
  origin: SystemData,
  destination: SystemData,
  relationship: RelationshipData,
  route: Partial<TradeRoute>
): Promise<string> {
  if (!openAIApiKey) {
    return `Trade route connecting ${origin.name} and ${destination.name}, facilitating ${route.primary_goods?.join(', ') || 'various goods'} exchange.`;
  }

  const prompt = `Generate a concise description (max 200 words) for a trade route between two galactic systems:

Origin: ${origin.name} (${origin.region}, ${origin.classification || 'Standard system'})
Destination: ${destination.name} (${destination.region}, ${destination.classification || 'Standard system'})
Route Type: ${route.route_type}
Primary Goods: ${route.primary_goods?.join(', ')}
Trade Volume: ${relationship.trade_volume_credits} credits
Safety Rating: ${route.safety_rating}/10
Travel Time: ${route.travel_time_days} days

Include details about the economic importance, goods transported, and strategic value of this route.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in galactic trade and commerce. Generate realistic, detailed descriptions of trade routes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return `Trade route connecting ${origin.name} and ${destination.name}, facilitating ${route.primary_goods?.join(', ') || 'various goods'} exchange.`;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || `Trade route connecting ${origin.name} and ${destination.name}.`;
  } catch (error) {
    console.error('Error generating description:', error);
    return `Trade route connecting ${origin.name} and ${destination.name}, facilitating ${route.primary_goods?.join(', ') || 'various goods'} exchange.`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting trade routes establishment...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batch_size = 10, force = false } = await req.json().catch(() => ({}));

    // Check if trade routes already exist
    const { data: existingRoutes, error: existingError } = await supabase
      .from('trade_routes')
      .select('id')
      .limit(1);

    if (existingError) {
      throw new Error(`Database error: ${existingError.message}`);
    }

    if (existingRoutes && existingRoutes.length > 0 && !force) {
      console.log('Trade routes already exist, skipping...');
      return new Response(JSON.stringify({
        success: true,
        message: 'Trade routes already exist. Use force=true to regenerate.',
        routes_created: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all systems with coordinates
    console.log('📊 Fetching galactic systems...');
    const { data: systems, error: systemsError } = await supabase
      .from('galactic_systems')
      .select('*')
      .not('coordinate_x', 'is', null)
      .not('coordinate_y', 'is', null)
      .not('coordinate_z', 'is', null);

    if (systemsError) {
      throw new Error(`Error fetching systems: ${systemsError.message}`);
    }

    console.log(`✅ Found ${systems?.length || 0} systems with coordinates`);

    // Get trade partner relationships with high trade volume
    console.log('📈 Fetching trade relationships...');
    const { data: relationships, error: relationshipsError } = await supabase
      .from('system_relationships')
      .select('*')
      .eq('relationship_type', 'trade_partner')
      .gte('trade_volume_credits', 1000000)
      .order('trade_volume_credits', { ascending: false })
      .limit(batch_size * 2);

    if (relationshipsError) {
      throw new Error(`Error fetching relationships: ${relationshipsError.message}`);
    }

    console.log(`✅ Found ${relationships?.length || 0} trade relationships`);

    if (!systems || !relationships || relationships.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No suitable trade relationships found',
        routes_created: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a map for quick system lookup
    const systemsMap = new Map(systems.map(s => [s.id, s]));

    console.log(`🔄 Processing up to ${batch_size} trade routes...`);
    const tradesToProcess = relationships.slice(0, batch_size);
    const routesToInsert: TradeRoute[] = [];

    for (const relationship of tradesToProcess) {
      const originSystem = systemsMap.get(relationship.system_a_id);
      const destinationSystem = systemsMap.get(relationship.system_b_id);

      if (!originSystem || !destinationSystem) {
        console.log(`⏭️ Skipping relationship: missing system data`);
        continue;
      }

      console.log(`🔍 Creating route: ${originSystem.name} ↔ ${destinationSystem.name}`);

      const distance = calculateDistance(originSystem, destinationSystem);
      const travelTime = Math.max(1, Math.round(distance / 1000)); // 1 day per 1000 units
      const safetyRating = determineSafetyRating(originSystem, destinationSystem);
      const primaryGoods = determinePrimaryGoods(originSystem, destinationSystem);
      const routeType = determineRouteType(distance, relationship.trade_volume_credits);
      const intermediates = findIntermediateSystems(originSystem, destinationSystem, systems, 2);

      const routeData: Partial<TradeRoute> = {
        name: `${originSystem.name} - ${destinationSystem.name} Trade Route`,
        origin_system_id: originSystem.id,
        destination_system_id: destinationSystem.id,
        route_type: routeType,
        safety_rating: safetyRating,
        primary_goods: primaryGoods,
        intermediate_systems: intermediates,
        controlling_faction: originSystem.allegiance || destinationSystem.allegiance || 'Independent',
        status: 'Active',
        travel_time_days: travelTime,
        established_date: '25 ABY', // Default establishment date
      };

      // Generate AI description
      const description = await generateRouteDescription(
        originSystem,
        destinationSystem,
        relationship,
        routeData
      );

      routesToInsert.push({
        ...routeData,
        description
      } as TradeRoute);

      console.log(`✅ Route created: ${routeData.name} (${travelTime} days, safety: ${safetyRating}/10)`);
    }

    // Insert trade routes in batch
    if (routesToInsert.length > 0) {
      console.log(`💾 Inserting ${routesToInsert.length} trade routes...`);
      
      const { data: insertedRoutes, error: insertError } = await supabase
        .from('trade_routes')
        .insert(routesToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error inserting trade routes:', insertError);
        throw new Error(`Failed to insert trade routes: ${insertError.message}`);
      }

      console.log(`✅ Successfully inserted ${insertedRoutes?.length || 0} trade routes`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully established ${routesToInsert.length} trade routes`,
      routes_created: routesToInsert.length,
      routes: routesToInsert.map(r => ({
        name: r.name,
        route_type: r.route_type,
        safety_rating: r.safety_rating,
        travel_time_days: r.travel_time_days
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in establish-trade-routes function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});