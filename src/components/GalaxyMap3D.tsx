import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STAR_SYSTEMS, GALACTIC_REGIONS, StarSystem } from '@/data/galaxyData';
import { supabase } from '@/integrations/supabase/client';

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

  const color = GALACTIC_REGIONS[system.region].color;
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
        radius={300} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
      />
      
      {/* Central galactic core glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[15, 32, 32]} />
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
}

export default function GalaxyMap3D({ selectedSystem, onSystemSelect }: GalaxyMap3DProps) {
  // TODO: Enable after database migration is complete
  // const [dbSystems, setDbSystems] = useState<StarSystem[]>([]);
  // const [loading, setLoading] = useState(true);

  // // Load systems from database with 3D coordinates
  // useEffect(() => {
  //   async function loadSystemsFromDB() {
  //     try {
  //       const { data: systems, error } = await supabase
  //         .from('galactic_systems')
  //         .select('id, name, region, grid_coordinates, coordinate_x, coordinate_y, coordinate_z, population, classification, description')
  //         .not('coordinate_x', 'is', null)
  //         .not('coordinate_y', 'is', null)
  //         .not('coordinate_z', 'is', null);

  //       if (error) {
  //         console.error('Error loading systems from DB:', error);
  //         return;
  //       }

  //       if (systems) {
  //         // Convert database systems to StarSystem format
  //         const convertedSystems: StarSystem[] = systems.map((sys) => ({
  //           id: sys.id,
  //           name: sys.name,
  //           region: sys.region,
  //           galacticCoordinates: sys.grid_coordinates || '',
  //           description: sys.description || '',
  //           // Convert from light-years to 3D scene units (1:5000 scale)
  //           coordinates: [
  //             (sys.coordinate_x || 0) / 5000,
  //             (sys.coordinate_y || 0) / 5000, 
  //             (sys.coordinate_z || 0) / 5000
  //           ] as [number, number, number],
  //           planets: [], // TODO: Load planets from DB
  //           significance: Math.min((sys.population || 0) / 1000000000, 5) // Scale significance based on population
  //         }));

  //         console.log(`✅ Loaded ${convertedSystems.length} systems from database with 3D coordinates`);
  //         setDbSystems(convertedSystems);
  //       }
  //     } catch (error) {
  //       console.error('Error loading systems:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   loadSystemsFromDB();
  // }, []);

  // // Combine database systems with fallback hardcoded systems
  // const allSystems = useMemo(() => {
  //   // Use database systems if available, otherwise fallback to hardcoded
  //   return dbSystems.length > 0 ? dbSystems : STAR_SYSTEMS;
  // }, [dbSystems]);

  // if (loading) {
  //   return (
  //     <div className="w-full h-full flex items-center justify-center">
  //       <div className="text-white">Cargando sistemas galácticos...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [50, 30, 50], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 0, 0]} intensity={0.8} color="#FFD700" />
          
          <GalaxyBackground />
          
          {STAR_SYSTEMS.map((system) => (
            <SystemMarker
              key={system.id}
              system={system}
              onSelect={onSystemSelect}
              selected={selectedSystem?.id === system.id}
            />
          ))}
          
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            zoomSpeed={0.6}
            panSpeed={0.8}
            rotateSpeed={0.4}
            maxDistance={200}
            minDistance={10}
          />
        </Suspense>
      </Canvas>
      
      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 p-2 rounded">
        {STAR_SYSTEMS.length} sistemas cargados (Local)
        {/* TODO: Show DB systems count after migration */}
      </div>
    </div>
  );
}