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
  // **ENHANCED**: Larger base size and more visible scaling
  const baseSize = Math.max(2.0, system.significance * 0.4);
  const populationBonus = system.population ? Math.min(1.0, Math.log10(system.population || 1) / 10) : 0;
  const size = baseSize + populationBonus;

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
      
      {/* Enhanced glow effect */}
      <mesh scale={size * 2.0}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={selected ? 0.5 : 0.25}
        />
      </mesh>

      {/* System name - scaled appropriately */}
      {(selected || hovered) && (
        <Text
          position={[0, size * 2.5, 0]}
          fontSize={Math.min(15, Math.max(8, size * 12))}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
        >
          {system.name}
        </Text>
      )}
      
      {/* Region indicator - smaller text */}
      {selected && (
        <Text
          position={[0, size * 2.5 + 12, 0]}
          fontSize={Math.min(10, Math.max(6, size * 8))}
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
      {/* Dense star field - expanded for better coverage */}
      <Stars 
        radius={5000} 
        depth={200} 
        count={8000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.1}
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
        camera={{ 
          position: [1500, 800, 1500], 
          fov: 60,
          near: 1,
          far: 15000
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Enhanced lighting setup */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[1000, 1000, 1000]} 
            intensity={0.3} 
            color="#FFFFFF" 
          />
          <pointLight 
            position={[0, 500, 0]} 
            intensity={0.2} 
            color="#4169E1" 
            distance={3000}
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
            zoomSpeed={0.8}
            panSpeed={1.5}
            rotateSpeed={0.6}
            maxDistance={12000}
            minDistance={50}
            target={[0, 0, 0]}
            enableDamping
            dampingFactor={0.05}
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