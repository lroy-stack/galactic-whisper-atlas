import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { generateSpiralArmPoints } from '@/lib/galacticCoordinates';
import * as THREE from 'three';

export default function SpiralArms() {
  const spiralArms = useMemo(() => {
    const arms = [];
    const armColors = ['#4A90E2', '#7B68EE', '#9370DB', '#6495ED', '#5F9EA0'];
    
    for (let i = 0; i < 5; i++) {
      const points = generateSpiralArmPoints(i);
      arms.push({
        points,
        color: armColors[i],
        index: i
      });
    }
    
    return arms;
  }, []);

  return (
    <>
      {spiralArms.map((arm) => (
        <Line
          key={arm.index}
          points={arm.points}
          color={arm.color}
          lineWidth={1.5}
          transparent={true}
          opacity={0.4}
        />
      ))}
      
      {/* Simplified spiral arm particle effect */}
      {spiralArms.map((arm) => (
        <group key={`particles-${arm.index}`}>
          {arm.points.filter((_, index) => index % 5 === 0).map((point, index) => (
            <mesh key={index} position={point}>
              <sphereGeometry args={[1.5, 6, 6]} />
              <meshBasicMaterial 
                color={arm.color}
                transparent={true}
                opacity={0.2}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}