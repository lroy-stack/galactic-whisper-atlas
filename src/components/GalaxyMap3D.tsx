import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STAR_SYSTEMS, GALACTIC_REGIONS, StarSystem, GalacticRegion, SystemType, Faction } from '@/data/galaxyData';
import { supabase } from '@/integrations/supabase/client';
import { useGalacticData } from '@/hooks/useGalacticData';
import RelationshipLines from './RelationshipLines';
import GalacticRegions from './GalacticRegions';
import SpiralArms from './SpiralArms';
import HyperspaceRoutes from './HyperspaceRoutes';
import GalacticCore from './GalacticCore';
import GalaxyGrid from './GalaxyGrid';

interface SystemMarkerProps {
  system: StarSystem;
  onSelect: (system: StarSystem) => void;
  selected: boolean;
}

function SystemMarker({ system, onSelect, selected }: SystemMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (selected || hovered) {
        meshRef.current.scale.setScalar(Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1.2);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const regionData = GALACTIC_REGIONS[system.region] || GALACTIC_REGIONS['Unknown Regions'];
  const color = regionData.color;
  const size = Math.max(0.3, system.significance * 0.15);

  return (
    <group position={system.coordinates}>
      <mesh
        ref={meshRef}
        onClick={() => onSelect(system)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={size}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={selected ? '#FFD700' : color}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh scale={size * 1.5}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={selected ? 0.3 : 0.1}
        />
      </mesh>

      {/* System name */}
      {(selected || hovered) && (
        <Text
          position={[0, size * 2, 0]}
          fontSize={0.8}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
        >
          {system.name}
        </Text>
      )}
      
      {/* Region indicator */}
      {selected && (
        <Text
          position={[0, size * 2 + 1, 0]}
          fontSize={0.4}
          color="#87CEEB"
          anchorX="center"
          anchorY="middle"
        >
          {system.region}
        </Text>
      )}
    </group>
  );
}

// Removed RegionVolumes - replaced by GalacticRegions component

function GalaxyBackground() {
  const { scene } = useThree();
  
  React.useEffect(() => {
    scene.background = new THREE.Color('#0a0a0f');
  }, [scene]);

  return (
    <>
      {/* Dense star field */}
      <Stars 
        radius={3000} 
        depth={100} 
        count={10000} 
        factor={6} 
        saturation={0} 
        fade 
        speed={0.2}
      />
      
      {/* Nebula effects in Unknown Regions */}
      <mesh position={[2000, 0, 2000]}>
        <sphereGeometry args={[300, 32, 32]} />
        <meshBasicMaterial 
          color="#483D8B"
          transparent
          opacity={0.05}
        />
      </mesh>
      
      <mesh position={[-2000, 50, -2000]}>
        <sphereGeometry args={[250, 32, 32]} />
        <meshBasicMaterial 
          color="#696969"
          transparent
          opacity={0.03}
        />
      </mesh>
    </>
  );
}

interface GalaxyMap3DProps {
  selectedSystem: StarSystem | null;
  onSystemSelect: (system: StarSystem) => void;
  showRelationships?: boolean;
  showGrid?: boolean;
  showSpiralArms?: boolean;
}

export default function GalaxyMap3D({ 
  selectedSystem, 
  onSystemSelect, 
  showRelationships = false,
  showGrid = true,
  showSpiralArms = true
}: GalaxyMap3DProps) {
  const { systems: dbSystems, relationships, loading } = useGalacticData();


  // Combine database systems with fallback hardcoded systems
  const allSystems = useMemo(() => {
    return dbSystems.length > 0 ? dbSystems : STAR_SYSTEMS;
  }, [dbSystems]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white">Cargando sistemas galácticos...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [800, 400, 800], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting setup */}
          <ambientLight intensity={0.3} />
          <directionalLight 
            position={[1000, 1000, 1000]} 
            intensity={0.5} 
            color="#FFFFFF" 
          />
          
          {/* Galaxy structure */}
          <GalaxyBackground />
          <GalacticCore />
          <GalacticRegions />
          
          {/* Spiral arms */}
          {showSpiralArms && <SpiralArms />}
          
          {/* Coordinate grid */}
          {showGrid && <GalaxyGrid />}
          
          {/* Star systems */}
          {allSystems.map((system) => (
            <SystemMarker
              key={system.id}
              system={system}
              onSelect={onSystemSelect}
              selected={selectedSystem?.id === system.id}
            />
          ))}

          {/* Relationships and routes */}
          <RelationshipLines 
            relationships={relationships}
            showRelationships={showRelationships}
          />
          
          <HyperspaceRoutes 
            systems={allSystems}
            showRoutes={showRelationships}
          />
          
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            zoomSpeed={1.2}
            panSpeed={2.0}
            rotateSpeed={0.8}
            maxDistance={5000}
            minDistance={50}
          />
        </Suspense>
      </Canvas>
      
      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 p-2 rounded">
        {allSystems.length} sistemas cargados ({dbSystems.length > 0 ? 'Base de Datos' : 'Local'})
      </div>
    </div>
  );
}