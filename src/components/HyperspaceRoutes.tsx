import React from 'react';
import { Line } from '@react-three/drei';
import { StarSystem } from '@/data/galaxyData';

interface HyperspaceRoutesProps {
  systems: StarSystem[];
  showRoutes: boolean;
}

const MAJOR_ROUTES = [
  {
    name: "Corellian Run",
    systems: ['coruscant', 'alderaan', 'naboo'],
    color: '#00FFFF',
    significance: 10
  },
  {
    name: "Perlemian Trade Route", 
    systems: ['coruscant', 'kashyyyk'],
    color: '#FF00FF',
    significance: 9
  },
  {
    name: "Hydian Way",
    systems: ['coruscant', 'tatooine', 'geonosis'],
    color: '#FFFF00',
    significance: 8
  },
  {
    name: "Rimma Trade Route",
    systems: ['naboo', 'tatooine'],
    color: '#00FF00',
    significance: 7
  }
];

export default function HyperspaceRoutes({ systems, showRoutes }: HyperspaceRoutesProps) {
  if (!showRoutes) return null;

  const systemsMap = React.useMemo(() => {
    const map = new Map();
    systems.forEach(system => {
      map.set(system.id, system);
    });
    return map;
  }, [systems]);

  return (
    <>
      {MAJOR_ROUTES.map((route) => {
        const routeSystems = route.systems
          .map(id => systemsMap.get(id))
          .filter(Boolean);
        
        if (routeSystems.length < 2) return null;

        const points = routeSystems.map(system => system.coordinates);

        return (
          <Line
            key={route.name}
            points={points}
            color={route.color}
            lineWidth={3}
            transparent
            opacity={0.8}
            dashed={true}
            dashSize={10}
            gapSize={5}
          />
        );
      })}
    </>
  );
}