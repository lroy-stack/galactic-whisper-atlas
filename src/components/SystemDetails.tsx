import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Globe, Users, History, Gem, MapPin, Zap } from 'lucide-react';
import { StarSystem } from '@/data/galaxyData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemDetailsProps {
  system: StarSystem | null;
  onEnrichmentComplete?: () => void;
}

interface EnrichedData {
  planets: any[];
  species: any[];
  historical_events: any[];
  resources: any[];
  locations: any[];
  trade_routes: any[];
  system_relationships: any[];
}

export default function SystemDetails({ system, onEnrichmentComplete }: SystemDetailsProps) {
  const [enrichedData, setEnrichedData] = useState<EnrichedData>({
    planets: [],
    species: [],
    historical_events: [],
    resources: [],
    locations: [],
    trade_routes: [],
    system_relationships: []
  });
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (system) {
      loadEnrichedData();
    }
  }, [system]);

  const loadEnrichedData = async () => {
    if (!system) return;

    try {
      const [planetsRes, speciesRes, eventsRes, resourcesRes, locationsRes, routesRes, relationshipsRes] = await Promise.all([
        supabase.from('planets').select('*').eq('system_id', system.id),
        supabase.from('species').select('*').eq('homeworld_id', system.id),
        supabase.from('historical_events').select('*').eq('system_id', system.id),
        supabase.from('resources').select('*').eq('system_id', system.id),
        supabase.from('locations').select('*').eq('system_id', system.id),
        supabase.from('trade_routes').select('*').or(`origin_system_id.eq.${system.id},destination_system_id.eq.${system.id}`),
        supabase.from('system_relationships').select('*').or(`system_a_id.eq.${system.id},system_b_id.eq.${system.id}`)
      ]);

      setEnrichedData({
        planets: planetsRes.data || [],
        species: speciesRes.data || [],
        historical_events: eventsRes.data || [],
        resources: resourcesRes.data || [],
        locations: locationsRes.data || [],
        trade_routes: routesRes.data || [],
        system_relationships: relationshipsRes.data || []
      });
    } catch (error) {
      console.error('Error loading enriched data:', error);
    }
  };

  const enrichSystem = async (enrichmentType: string) => {
    if (!system || enriching) return;

    setEnriching(enrichmentType);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('galactic-enrichment', {
        body: {
          systemName: system.name,
          enrichmentType
        }
      });

      if (error) throw error;

      toast({
        title: "Enriquecimiento Completado",
        description: `Se ha enriquecido ${system.name} con datos de ${enrichmentType}`,
      });

      await loadEnrichedData();
      onEnrichmentComplete?.();
    } catch (error) {
      console.error('Error enriching system:', error);
      toast({
        title: "Error",
        description: `Error al enriquecer ${enrichmentType}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setEnriching(null);
    }
  };

  if (!system) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Selecciona un sistema para ver detalles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          {system.name}
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{system.region}</Badge>
          <Badge variant="secondary">{system.classification}</Badge>
          <Badge variant="outline">{system.allegiance}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="planets">Planetas</TabsTrigger>
            <TabsTrigger value="species">Especies</TabsTrigger>
            <TabsTrigger value="history">Historia</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Información General</h4>
                  <p className="text-sm text-muted-foreground">{system.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Región</p>
                    <p className="text-sm text-muted-foreground">{system.region}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Población</p>
                    <p className="text-sm text-muted-foreground">{system.population?.toLocaleString() || 'Desconocida'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Importancia</p>
                    <p className="text-sm text-muted-foreground">{system.significance}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Coordenadas</p>
                    <p className="text-sm text-muted-foreground">
                      {system.coordinates[0]}, {system.coordinates[1]}, {system.coordinates[2]}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2">
                  {enrichedData.planets.length === 0 && (
                    <Button 
                      onClick={() => enrichSystem('planets')}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      {enriching === 'planets' ? 'Generando...' : 'Generar Planetas'}
                    </Button>
                  )}
                  
                  {enrichedData.species.length === 0 && (
                    <Button 
                      onClick={() => enrichSystem('species')}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      {enriching === 'species' ? 'Generando...' : 'Generar Especies'}
                    </Button>
                  )}
                  
                  {enrichedData.historical_events.length === 0 && (
                    <Button 
                      onClick={() => enrichSystem('history')}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <History className="w-4 h-4" />
                      {enriching === 'history' ? 'Generando...' : 'Generar Historia'}
                    </Button>
                  )}
                  
                  {enrichedData.resources.length === 0 && (
                    <Button 
                      onClick={() => enrichSystem('resources')}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Gem className="w-4 h-4" />
                      {enriching === 'resources' ? 'Generando...' : 'Generar Recursos'}
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="planets" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {enrichedData.planets.length > 0 ? (
                <div className="space-y-4">
                  {enrichedData.planets.map((planet, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{planet.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{planet.type}</Badge>
                          <Badge variant="secondary">{planet.climate}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{planet.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span><strong>Población:</strong> {planet.population?.toLocaleString() || 'N/A'}</span>
                          <span><strong>Gravedad:</strong> {planet.gravity_standard}g</span>
                          <span><strong>Atmósfera:</strong> {planet.atmosphere}</span>
                          <span><strong>Terreno:</strong> {planet.terrain}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay planetas generados</p>
                    <Button 
                      onClick={() => enrichSystem('planets')}
                      disabled={loading}
                      className="mt-2"
                    >
                      {enriching === 'planets' ? 'Generando...' : 'Generar Planetas'}
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="species" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {enrichedData.species.length > 0 ? (
                <div className="space-y-4">
                  {enrichedData.species.map((species, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{species.name}</CardTitle>
                        <Badge variant="outline">{species.classification}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{species.physical_description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span><strong>Altura promedio:</strong> {species.average_height_cm}cm</span>
                          <span><strong>Esperanza de vida:</strong> {species.average_lifespan_years} años</span>
                          <span><strong>Sensibilidad a la Fuerza:</strong> {species.force_sensitivity}</span>
                          <span><strong>Estructura social:</strong> {species.society_structure}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay especies generadas</p>
                    <Button 
                      onClick={() => enrichSystem('species')}
                      disabled={loading}
                      className="mt-2"
                    >
                      {enriching === 'species' ? 'Generando...' : 'Generar Especies'}
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {enrichedData.historical_events.length > 0 ? (
                <div className="space-y-4">
                  {enrichedData.historical_events.map((event, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{event.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{event.event_type}</Badge>
                          <Badge variant="secondary">{event.significance}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span><strong>Inicio:</strong> {event.start_date}</span>
                          <span><strong>Final:</strong> {event.end_date || 'Ongoing'}</span>
                          <span><strong>Resultado:</strong> {event.outcome}</span>
                          <span><strong>Participantes:</strong> {event.participants?.join(', ')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay eventos históricos generados</p>
                    <Button 
                      onClick={() => enrichSystem('history')}
                      disabled={loading}
                      className="mt-2"
                    >
                      {enriching === 'history' ? 'Generando...' : 'Generar Historia'}
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}