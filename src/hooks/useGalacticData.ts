import { useState, useEffect } from 'react';
import { StarSystem, GalacticRegion, SystemType, Faction } from '@/data/galaxyData';
import { supabase } from '@/integrations/supabase/client';

export interface GalacticSystemRelationship {
  id: string;
  system_a: {
    id: string;
    name: string;
    coordinate_x: number;
    coordinate_y: number;
    coordinate_z: number;
  };
  system_b: {
    id: string;
    name: string;
    coordinate_x: number;
    coordinate_y: number;
    coordinate_z: number;
  };
  relationship_type: string;
  strength: number;
  trade_volume_credits: number;
}

export function useGalacticData() {
  const [systems, setSystems] = useState<StarSystem[]>([]);
  const [relationships, setRelationships] = useState<GalacticSystemRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadSystems = async () => {
    try {
      const { data: systemsData, error } = await supabase
        .from('galactic_systems')
        .select('*')
        .not('coordinate_x', 'is', null)
        .not('coordinate_y', 'is', null)
        .not('coordinate_z', 'is', null);

      if (error) throw error;

      if (systemsData) {
        const convertedSystems: StarSystem[] = systemsData.map((sys) => ({
          id: sys.id,
          name: sys.name,
          region: sys.region as GalacticRegion,
          sector: sys.sector || '',
          galacticCoordinates: sys.grid_coordinates || '',
          classification: sys.classification as SystemType,
          population: sys.population || 0,
          allegiance: sys.allegiance as Faction,
          significance: Number(sys.significance) || Math.min((sys.population || 0) / 1000000000, 5),
          description: sys.description || '',
          coordinates: [
            sys.coordinate_x || 0,
            sys.coordinate_y || 0,
            sys.coordinate_z || 0
          ] as [number, number, number],
          planets: []
        }));

        setSystems(convertedSystems);
      }
    } catch (error) {
      console.error('Error loading systems:', error);
    }
  };

  const loadRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('system_relationships')
        .select(`
          id,
          relationship_type,
          strength,
          trade_volume_credits,
          system_a:galactic_systems!system_a_id(id, name, coordinate_x, coordinate_y, coordinate_z),
          system_b:galactic_systems!system_b_id(id, name, coordinate_x, coordinate_y, coordinate_z)
        `)
        .not('system_a.coordinate_x', 'is', null)
        .not('system_b.coordinate_x', 'is', null);

      if (error) throw error;

      if (data) {
        const validRelationships = data.filter(rel => 
          rel.system_a && rel.system_b
        ) as GalacticSystemRelationship[];
        
        setRelationships(validRelationships);
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadSystems(), loadRelationships()]);
      setLoading(false);
    };

    loadData();
  }, [refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    systems,
    relationships,
    loading,
    refresh
  };
}