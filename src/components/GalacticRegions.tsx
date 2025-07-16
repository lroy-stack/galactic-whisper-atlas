import React from 'react';
import { getAllRegionConfigs } from '@/lib/galacticCoordinates';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export default function GalacticRegions() {
  const regions = getAllRegionConfigs();

  return (
    <>
      {Object.entries(regions).map(([name, config]) => {
        const averageRadius = (config.minRadius + config.maxRadius) / 2;
        const ringThickness = config.maxRadius - config.minRadius;
        
        return (
          <group key={name}>
            {/* Region ring */}
            <mesh position={[0, 0, 0]}>
              <ringGeometry args={[config.minRadius, config.maxRadius, 64]} />
              <meshBasicMaterial 
                color={config.color}
                transparent={true}
                opacity={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
            
            {/* Region label */}
            <Text
              position={[averageRadius * 0.7, 5, averageRadius * 0.7]}
              fontSize={Math.max(15, ringThickness * 0.1)}
              color={config.color}
              anchorX="center"
              anchorY="middle"
              rotation={[0, Math.PI / 4, 0]}
            >
              {name}
            </Text>
          </group>
        );
      })}
    </>
  );
}