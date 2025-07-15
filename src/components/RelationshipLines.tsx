import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { GalacticSystemRelationship } from '@/hooks/useGalacticData';

interface RelationshipLinesProps {
  relationships: GalacticSystemRelationship[];
  showRelationships: boolean;
}

export default function RelationshipLines({ relationships, showRelationships }: RelationshipLinesProps) {
  const relationshipLines = useMemo(() => {
    if (!showRelationships) return [];

    return relationships.map((rel) => {
      const startPos = [
        (rel.system_a.coordinate_x || 0) / 5000,
        (rel.system_a.coordinate_y || 0) / 5000,
        (rel.system_a.coordinate_z || 0) / 5000
      ] as [number, number, number];

      const endPos = [
        (rel.system_b.coordinate_x || 0) / 5000,
        (rel.system_b.coordinate_y || 0) / 5000,
        (rel.system_b.coordinate_z || 0) / 5000
      ] as [number, number, number];

      let color = '#4A90E2';
      let opacity = 0.3;

      switch (rel.relationship_type) {
        case 'allied':
          color = '#5CB85C';
          opacity = 0.6;
          break;
        case 'trade_partner':
          color = '#F0AD4E';
          opacity = 0.4;
          break;
        case 'enemy':
          color = '#D9534F';
          opacity = 0.7;
          break;
        case 'neutral':
          color = '#6C757D';
          opacity = 0.2;
          break;
        default:
          color = '#4A90E2';
          opacity = 0.3;
      }

      return {
        id: rel.id,
        points: [startPos, endPos],
        color,
        opacity,
        strength: rel.strength || 1,
        tradeVolume: rel.trade_volume_credits || 0
      };
    });
  }, [relationships, showRelationships]);

  if (!showRelationships || relationshipLines.length === 0) {
    return null;
  }

  return (
    <>
      {relationshipLines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          color={line.color}
          lineWidth={Math.max(1, (line.strength || 1) * 2)}
          transparent
          opacity={line.opacity}
        />
      ))}
    </>
  );
}