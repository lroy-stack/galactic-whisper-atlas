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
            {/* Region ring - horizontal orientation */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[config.minRadius, config.maxRadius, 64]} />
              <meshBasicMaterial 
                color={config.color}
                transparent={true}
                opacity={0.25}
                side={THREE.DoubleSide}
              />
            </mesh>
            
            {/* Region label - positioned horizontally around the ring */}
            <Text
              position={[averageRadius * 0.8, 8, 0]}
              fontSize={Math.min(25, Math.max(12, ringThickness * 0.08))}
              color={config.color}
              anchorX="center"
              anchorY="middle"
              rotation={[0, 0, 0]}
            >
              {name}
            </Text>
          </group>
        );
      })}
    </>
  );
}