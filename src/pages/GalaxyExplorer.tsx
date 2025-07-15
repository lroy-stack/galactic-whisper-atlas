import React, { useState } from 'react';
import GalaxyMap3D from '@/components/GalaxyMap3D';
import SystemDetails from '@/components/SystemDetails';
import AIAgent from '@/components/AIAgent';
import { StarSystem } from '@/data/galaxyData';

export default function GalaxyExplorer() {
  const [selectedSystem, setSelectedSystem] = useState<StarSystem | null>(null);

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
            <h1 className="text-2xl font-bold text-primary">
              Mapa Galáctico de Star Wars
            </h1>
            <p className="text-sm text-muted-foreground">
              Explora la galaxia muy, muy lejana con navegación 3D interactiva y IA especializada
            </p>
          </div>
        </div>
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