import React, { useState } from 'react';
import GalaxyMap3D from '@/components/GalaxyMap3D';
import SystemDetails from '@/components/SystemDetails';
import AIAgent from '@/components/AIAgent';
import SystemDataCompletion from '@/components/SystemDataCompletion';
import CoordinateCalculation from '@/components/CoordinateCalculation';
import CoordinateTest from '@/components/CoordinateTest';
import { StarSystem } from '@/data/galaxyData';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function GalaxyExplorer() {
  const [selectedSystem, setSelectedSystem] = useState<StarSystem | null>(null);
  const [showDataCompletion, setShowDataCompletion] = useState(false);
  const [showCoordinateCalculation, setShowCoordinateCalculation] = useState(false);
  const [showCoordinateTest, setShowCoordinateTest] = useState(false);

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
                  onClick={() => setShowCoordinateCalculation(!showCoordinateCalculation)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Coordenadas 3D
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

        {/* Coordinate Calculation Modal Overlay */}
        {showCoordinateCalculation && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCoordinateCalculation(false)}
                className="absolute -top-2 -right-2 z-30"
              >
                ✕
              </Button>
              <CoordinateCalculation />
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
      </div>

      {/* Right Sidebar */}
      <div className="w-96 flex flex-col gap-4 p-4 border-l border-border">
        {/* System Information */}
        <div className="flex-1">
          <SystemDetails 
            system={selectedSystem}
            onEnrichmentComplete={() => {
              // Optionally refresh data or trigger updates
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