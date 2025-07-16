import React from 'react';
import { Text } from '@react-three/drei';

export default function GalaxyGrid() {
  const gridSize = 2400;
  const gridSpacing = gridSize / 21; // 21 divisions for numbers 1-21
  const letterSpacing = gridSize / 13; // 13 divisions for letters A-M (covering main galaxy)

  return (
    <>
      {/* Coordinate grid lines */}
      <group>
        {/* Horizontal lines (letters) */}
        {Array.from({ length: 14 }, (_, i) => {
          const letter = String.fromCharCode(65 + i); // A-M
          const y = 0;
          const x = -gridSize/2 + i * letterSpacing;
          
          return (
            <group key={`h-${letter}`}>
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      x, y, -gridSize/2,
                      x, y, gridSize/2
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#444444" transparent opacity={0.3} />
              </line>
              
              {/* Letter labels */}
              <Text
                position={[x, 20, gridSize/2 + 50]}
                fontSize={30}
                color="#CCCCCC"
                anchorX="center"
                anchorY="middle"
              >
                {letter}
              </Text>
            </group>
          );
        })}

        {/* Vertical lines (numbers) */}
        {Array.from({ length: 22 }, (_, i) => {
          const number = i + 1; // 1-21
          const y = 0;
          const z = -gridSize/2 + i * gridSpacing;
          
          return (
            <group key={`v-${number}`}>
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      -gridSize/2, y, z,
                      gridSize/2, y, z
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#444444" transparent opacity={0.3} />
              </line>
              
              {/* Number labels */}
              <Text
                position={[gridSize/2 + 50, 20, z]}
                fontSize={25}
                color="#CCCCCC"
                anchorX="center"
                anchorY="middle"
              >
                {number}
              </Text>
            </group>
          );
        })}
      </group>

      {/* Galaxy center marker */}
      <Text
        position={[0, 30, 0]}
        fontSize={40}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
      >
        Galactic Center
      </Text>
    </>
  );
}