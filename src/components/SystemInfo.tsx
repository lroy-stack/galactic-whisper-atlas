import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Users, 
  Globe, 
  Crown, 
  Star,
  Navigation
} from 'lucide-react';
import { StarSystem } from '@/data/galaxyData';

interface SystemInfoProps {
  system: StarSystem | null;
  onNavigateToSystem: (system: StarSystem) => void;
}

export default function SystemInfo({ system, onNavigateToSystem }: SystemInfoProps) {
  if (!system) {
    return (
      <Card className="hologram-border p-6 h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-primary animate-float" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">
            Selecciona un Sistema Estelar
          </h3>
          <p className="text-sm text-muted-foreground">
            Haz clic en cualquier sistema en el mapa 3D para ver información detallada
          </p>
        </div>
      </Card>
    );
  }

  const formatPopulation = (pop?: number) => {
    if (!pop) return 'Desconocido';
    if (pop >= 1e12) return `${(pop / 1e12).toFixed(1)} billones`;
    if (pop >= 1e9) return `${(pop / 1e9).toFixed(1)} mil millones`;
    if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)} millones`;
    if (pop >= 1e3) return `${(pop / 1e3).toFixed(1)}K`;
    return pop.toString();
  };

  const getSignificanceColor = (significance: number) => {
    if (significance >= 9) return 'text-primary';
    if (significance >= 7) return 'text-secondary';
    if (significance >= 5) return 'text-accent';
    return 'text-muted-foreground';
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Capital': return 'imperial-gradient';
      case 'Major World': return 'rebel-gradient';
      case 'Trade Hub': return 'nebula-gradient';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="hologram-border p-6 h-full space-y-6 animate-zoom-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">{system.name}</h2>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.floor(system.significance / 2) }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 fill-current ${getSignificanceColor(system.significance)}`} />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{system.description}</p>
      </div>

      <Separator />

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">Región:</span>
          </div>
          <Badge variant="secondary" className="ml-6">
            {system.region}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="font-medium">Coordenadas:</span>
          </div>
          <code className="ml-6 text-sm font-mono bg-muted px-2 py-1 rounded">
            {system.galacticCoordinates}
          </code>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-primary" />
            <span className="font-medium">Clasificación:</span>
          </div>
          <Badge className={`ml-6 ${getClassificationColor(system.classification)}`}>
            {system.classification}
          </Badge>
        </div>

        {system.allegiance && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-medium">Lealtad:</span>
            </div>
            <Badge variant="outline" className="ml-6">
              {system.allegiance}
            </Badge>
          </div>
        )}
      </div>

      {system.sector && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Sector:</span>
          <p className="text-sm text-muted-foreground">{system.sector}</p>
        </div>
      )}

      {/* Planets Info */}
      {system.planets.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Planetas
            </h3>
            {system.planets.map((planet, index) => (
              <Card key={index} className="p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{planet.name}</h4>
                    <Badge variant="outline">{planet.type}</Badge>
                  </div>
                  
                  {planet.population !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Población: {formatPopulation(planet.population)}</span>
                    </div>
                  )}
                  
                  {planet.climate && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Clima:</span> {planet.climate}
                    </p>
                  )}
                  
                  {planet.terrain && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Terreno:</span> {planet.terrain}
                    </p>
                  )}
                  
                  {planet.species && planet.species.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {planet.species.map((species, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {species}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Navigation Button */}
      <div className="pt-4">
        <Button 
          onClick={() => onNavigateToSystem(system)}
          className="w-full space-glow"
          variant="default"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Enfocar en el Mapa
        </Button>
      </div>
    </Card>
  );
}