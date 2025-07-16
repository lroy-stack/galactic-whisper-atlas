import React, { useMemo } from 'react';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';

export default function GalaxyGrid() {
  const gridSize = 3000;
  const gridSpacing = gridSize / 21; // 21 divisions for numbers 1-21
  const letterSpacing = gridSize / 13; // 13 divisions for letters A-M (covering main galaxy)

  const gridLines = useMemo(() => {
    const lines = [];
    
    // Horizontal lines (letters)
    for (let i = 0; i < 14; i++) {
      const letter = String.fromCharCode(65 + i); // A-M
      const x = -gridSize/2 + i * letterSpacing;
      
      lines.push({
        key: `h-${letter}`,
        points: [
          [x, 0, -gridSize/2],
          [x, 0, gridSize/2]
        ],
        label: letter,
        labelPosition: [x, 20, gridSize/2 + 50] as [number, number, number]
      });
    }
    
    // Vertical lines (numbers)
    for (let i = 0; i < 22; i++) {
      const number = i + 1; // 1-21
      const z = -gridSize/2 + i * gridSpacing;
      
      lines.push({
        key: `v-${number}`,
        points: [
          [-gridSize/2, 0, z],
          [gridSize/2, 0, z]
        ],
        label: number.toString(),
        labelPosition: [gridSize/2 + 50, 20, z] as [number, number, number]
      });
    }
    
    return lines;
  }, [gridSize, gridSpacing, letterSpacing]);

  return (
    <>
      {/* Grid lines */}
      {gridLines.map((line) => (
        <group key={line.key}>
          <Line
            points={line.points}
            color="#666666"
            transparent
            opacity={0.15}
            lineWidth={0.8}
          />
          
          {/* Labels - smaller and less prominent */}
          <Text
            position={line.labelPosition}
            fontSize={line.key.startsWith('h-') ? 18 : 15}
            color="#999999"
            anchorX="center"
            anchorY="middle"
          >
            {line.label}
          </Text>
        </group>
      ))}

      {/* Galaxy center marker - more subtle */}
      <Text
        position={[0, 25, 0]}
        fontSize={20}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
      >
        Galactic Center
      </Text>
    </>
  );
}