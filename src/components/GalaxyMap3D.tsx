import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STAR_SYSTEMS, GALACTIC_REGIONS, StarSystem, GalacticRegion, SystemType, Faction } from '@/data/galaxyData';
import { supabase } from '@/integrations/supabase/client';
import { useGalacticData } from '@/hooks/useGalacticData';
import RelationshipLines from './RelationshipLines';

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

function RegionVolumes() {
  const regions = useMemo(() => {
    const regionBounds: Record<string, { min: THREE.Vector3; max: THREE.Vector3; systems: StarSystem[] }> = {};
    
    // Calculate bounds for each region based on systems
    STAR_SYSTEMS.forEach(system => {
      const regionName = system.region;
      if (!regionBounds[regionName]) {
        regionBounds[regionName] = {
          min: new THREE.Vector3(Infinity, Infinity, Infinity),
          max: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
          systems: []
        };
      }
      
      const pos = new THREE.Vector3(...system.coordinates);
      regionBounds[regionName].min.min(pos);
      regionBounds[regionName].max.max(pos);
      regionBounds[regionName].systems.push(system);
    });

    return Object.entries(regionBounds).map(([name, bounds]) => ({
      name: name as keyof typeof GALACTIC_REGIONS,
      center: bounds.min.clone().add(bounds.max).multiplyScalar(0.5),
      size: bounds.max.clone().sub(bounds.min).addScalar(10),
      color: GALACTIC_REGIONS[name as keyof typeof GALACTIC_REGIONS].color
    }));
  }, []);

  return (
    <>
      {regions.map((region) => (
        <mesh key={region.name} position={region.center.toArray()}>
          <boxGeometry args={region.size.toArray()} />
          <meshBasicMaterial 
            color={region.color}
            transparent
            opacity={0.05}
            wireframe
          />
        </mesh>
      ))}
    </>
  );
}

function GalaxyBackground() {
  const { scene } = useThree();
  
  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    scene.background = new THREE.Color('#0a0a0f');
  }, [scene]);

  return (
    <>
      <Stars 
        radius={3000000} 
        depth={500000} 
        count={8000} 
        factor={4} 
        saturation={0} 
        fade 
      />
      
      {/* Central galactic core glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[50000, 32, 32]} />
        <meshBasicMaterial 
          color="#FFD700"
          transparent
          opacity={0.1}
        />
      </mesh>
    </>
  );
}

interface GalaxyMap3DProps {
  selectedSystem: StarSystem | null;
  onSystemSelect: (system: StarSystem) => void;
  showRelationships?: boolean;
}

export default function GalaxyMap3D({ selectedSystem, onSystemSelect, showRelationships = false }: GalaxyMap3DProps) {
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
        camera={{ position: [50000, 30000, 50000], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 0, 0]} intensity={0.8} color="#FFD700" />
          
          <GalaxyBackground />
          
          {allSystems.map((system) => (
            <SystemMarker
              key={system.id}
              system={system}
              onSelect={onSystemSelect}
              selected={selectedSystem?.id === system.id}
            />
          ))}

          <RelationshipLines 
            relationships={relationships}
            showRelationships={showRelationships}
          />
          
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            zoomSpeed={0.6}
            panSpeed={0.8}
            rotateSpeed={0.4}
            maxDistance={1500000}
            minDistance={1000}
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