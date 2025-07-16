import React, { useState } from 'react';
import GalaxyMap3D from '@/components/GalaxyMap3D';
import SystemDetails from '@/components/SystemDetails';
import AIAgent from '@/components/AIAgent';
import SystemDataCompletion from '@/components/SystemDataCompletion';
import CoordinateCleaner from '@/components/CoordinateCleaner';
import CoordinateMapper from '@/components/CoordinateMapper';
import CoordinateTest from '@/components/CoordinateTest';

import SystemRelationshipAnalysis from '@/components/SystemRelationshipAnalysis';
import { StarSystem } from '@/data/galaxyData';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, GitBranch, Trash2, Map } from 'lucide-react';
import { useGalacticData } from '@/hooks/useGalacticData';

export default function GalaxyExplorer() {
  const [selectedSystem, setSelectedSystem] = useState<StarSystem | null>(null);
  const [showDataCompletion, setShowDataCompletion] = useState(false);
  const [showCoordinateCleaner, setShowCoordinateCleaner] = useState(false);
  const [showCoordinateMapper, setShowCoordinateMapper] = useState(false);
  const [showCoordinateTest, setShowCoordinateTest] = useState(false);
  
  const [showRelationshipAnalysis, setShowRelationshipAnalysis] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showSpiralArms, setShowSpiralArms] = useState(true);
  
  const { refresh } = useGalacticData();

  const handleSystemSelect = (system: StarSystem) => {
    setSelectedSystem(system);
  };

  const handleSystemNavigate = (system: StarSystem) => {
    setSelectedSystem(system);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Main 3D Map */}
      <div className="flex-1 relative">
          <GalaxyMap3D 
            selectedSystem={selectedSystem}
            onSystemSelect={handleSystemSelect}
            showRelationships={showRelationships}
            showGrid={showGrid}
            showSpiralArms={showSpiralArms}
          />
        
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="hologram-border p-4 bg-card/80 backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  Mapa Galáctico de Star Wars
                </h1>
                <p className="text-sm text-muted-foreground">
                  Explora la galaxia muy, muy lejana con navegación 3D interactiva y IA especializada
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataCompletion(!showDataCompletion)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Completar Datos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCoordinateCleaner(!showCoordinateCleaner)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar Coordenadas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCoordinateMapper(!showCoordinateMapper)}
                  className="flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  Mapear Coordenadas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCoordinateTest(!showCoordinateTest)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Test Coordenadas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRelationshipAnalysis(!showRelationshipAnalysis)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Relaciones
                </Button>
              </div>
            </div>
            
            {/* Visualization Controls */}
            <div className="mt-4 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={showRelationships}
                  onCheckedChange={setShowRelationships}
                  id="show-relationships"
                />
                <label htmlFor="show-relationships" className="text-sm font-medium flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Relaciones
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                  id="show-grid"
                />
                <label htmlFor="show-grid" className="text-sm font-medium">
                  Grid
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  checked={showSpiralArms}
                  onCheckedChange={setShowSpiralArms}
                  id="show-spiral-arms"
                />
                <label htmlFor="show-spiral-arms" className="text-sm font-medium">
                  Brazos Espirales
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Data Completion Modal Overlay */}
        {showDataCompletion && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataCompletion(false)}
                className="absolute -top-2 -right-2 z-30"
              >
                ✕
              </Button>
              <SystemDataCompletion />
            </div>
          </div>
        )}

        {/* Coordinate Cleaner Modal Overlay */}
        {showCoordinateCleaner && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCoordinateCleaner(false)}
                className="absolute -top-2 -right-2 z-30"
              >
                ✕
              </Button>
              <CoordinateCleaner />
            </div>
          </div>
        )}

        {/* Coordinate Mapper Modal Overlay */}
        {showCoordinateMapper && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCoordinateMapper(false)}
                className="absolute -top-2 -right-2 z-30"
              >
                ✕
              </Button>
              <CoordinateMapper />
            </div>
          </div>
        )}

        {/* Coordinate Test Modal Overlay */}
        {showCoordinateTest && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCoordinateTest(false)}
                className="absolute -top-2 -right-2 z-30"
              >
                ✕
              </Button>
              <CoordinateTest />
            </div>
          </div>
        )}


        {/* Relationship Analysis Modal Overlay */}
        {showRelationshipAnalysis && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRelationshipAnalysis(false)}
                className="absolute -top-2 -right-2 z-30"
              >
                ✕
              </Button>
              <SystemRelationshipAnalysis />
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-96 flex flex-col gap-4 p-4 border-l border-border">
        {/* System Information */}
        <div className="flex-1">
          <SystemDetails 
            system={selectedSystem}
            onEnrichmentComplete={() => {
              refresh(); // Refresh galactic data when enrichment completes
            }}
          />
        </div>

        {/* AI Agent */}
        <div className="h-96">
          <AIAgent
            selectedSystem={selectedSystem}
            onSystemNavigate={handleSystemNavigate}
          />
        </div>
      </div>
    </div>
  );
}