import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function GalacticCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.005;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.002;
      const intensity = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.3;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = intensity;
    }
  });

  return (
    <>
      {/* Central black hole / core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial 
          color="#FFD700"
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Accretion disk */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12, 50, 64]} />
        <meshBasicMaterial 
          color="#FFA500"
          transparent={true}
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial 
          color="#FFD700"
          transparent={true}
          opacity={0.1}
        />
      </mesh>
      
      {/* Core light source */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={2} 
        color="#FFD700" 
        distance={500}
        decay={1}
      />
    </>
  );
}