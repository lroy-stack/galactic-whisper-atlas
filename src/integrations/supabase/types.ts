export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      code_examples: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          summary: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          summary: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          summary?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_examples_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      crawled_pages: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawled_pages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      galactic_systems: {
        Row: {
          allegiance: string | null
          classification: string | null
          climate: string | null
          created_at: string
          description: string | null
          grid_coordinates: string | null
          id: string
          name: string
          population: number | null
          region: string
          sector: string | null
          significance: string | null
          species: string[] | null
          terrain: string | null
          updated_at: string
        }
        Insert: {
          allegiance?: string | null
          classification?: string | null
          climate?: string | null
          created_at?: string
          description?: string | null
          grid_coordinates?: string | null
          id?: string
          name: string
          population?: number | null
          region: string
          sector?: string | null
          significance?: string | null
          species?: string[] | null
          terrain?: string | null
          updated_at?: string
        }
        Update: {
          allegiance?: string | null
          classification?: string | null
          climate?: string | null
          created_at?: string
          description?: string | null
          grid_coordinates?: string | null
          id?: string
          name?: string
          population?: number | null
          region?: string
          sector?: string | null
          significance?: string | null
          species?: string[] | null
          terrain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      historical_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          name: string
          outcome: string | null
          participants: string[] | null
          planet_id: string | null
          related_events: string[] | null
          significance: string | null
          start_date: string | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          name: string
          outcome?: string | null
          participants?: string[] | null
          planet_id?: string | null
          related_events?: string[] | null
          significance?: string | null
          start_date?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          name?: string
          outcome?: string | null
          participants?: string[] | null
          planet_id?: string | null
          related_events?: string[] | null
          significance?: string | null
          start_date?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_events_planet_id_fkey"
            columns: ["planet_id"]
            isOneToOne: false
            referencedRelation: "planets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_events_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          access_restrictions: string | null
          architectural_style: string | null
          controlling_faction: string | null
          coordinates_lat: number | null
          coordinates_lon: number | null
          created_at: string | null
          description: string | null
          economic_importance: string | null
          founding_date: string | null
          historical_significance: string | null
          id: string
          location_type: string | null
          name: string
          notable_features: string[] | null
          planet_id: string | null
          population: number | null
          strategic_value: string | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_restrictions?: string | null
          architectural_style?: string | null
          controlling_faction?: string | null
          coordinates_lat?: number | null
          coordinates_lon?: number | null
          created_at?: string | null
          description?: string | null
          economic_importance?: string | null
          founding_date?: string | null
          historical_significance?: string | null
          id?: string
          location_type?: string | null
          name: string
          notable_features?: string[] | null
          planet_id?: string | null
          population?: number | null
          strategic_value?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_restrictions?: string | null
          architectural_style?: string | null
          controlling_faction?: string | null
          coordinates_lat?: number | null
          coordinates_lon?: number | null
          created_at?: string | null
          description?: string | null
          economic_importance?: string | null
          founding_date?: string | null
          historical_significance?: string | null
          id?: string
          location_type?: string | null
          name?: string
          notable_features?: string[] | null
          planet_id?: string | null
          population?: number | null
          strategic_value?: string | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_planet_id_fkey"
            columns: ["planet_id"]
            isOneToOne: false
            referencedRelation: "planets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      planets: {
        Row: {
          atmosphere: string | null
          climate: Database["public"]["Enums"]["climate_type"] | null
          created_at: string | null
          day_length_hours: number | null
          description: string | null
          diameter_km: number | null
          flora_fauna: string | null
          government_type: string | null
          gravity_standard: number | null
          hydrosphere_percentage: number | null
          id: string
          imported_species: string[] | null
          major_cities: string[] | null
          name: string
          native_species: string[] | null
          natural_resources: string[] | null
          notable_locations: string[] | null
          population: number | null
          system_id: string | null
          technology_level: string | null
          terrain: string | null
          trade_specialties: string[] | null
          type: Database["public"]["Enums"]["planet_type"] | null
          updated_at: string | null
          year_length_days: number | null
        }
        Insert: {
          atmosphere?: string | null
          climate?: Database["public"]["Enums"]["climate_type"] | null
          created_at?: string | null
          day_length_hours?: number | null
          description?: string | null
          diameter_km?: number | null
          flora_fauna?: string | null
          government_type?: string | null
          gravity_standard?: number | null
          hydrosphere_percentage?: number | null
          id?: string
          imported_species?: string[] | null
          major_cities?: string[] | null
          name: string
          native_species?: string[] | null
          natural_resources?: string[] | null
          notable_locations?: string[] | null
          population?: number | null
          system_id?: string | null
          technology_level?: string | null
          terrain?: string | null
          trade_specialties?: string[] | null
          type?: Database["public"]["Enums"]["planet_type"] | null
          updated_at?: string | null
          year_length_days?: number | null
        }
        Update: {
          atmosphere?: string | null
          climate?: Database["public"]["Enums"]["climate_type"] | null
          created_at?: string | null
          day_length_hours?: number | null
          description?: string | null
          diameter_km?: number | null
          flora_fauna?: string | null
          government_type?: string | null
          gravity_standard?: number | null
          hydrosphere_percentage?: number | null
          id?: string
          imported_species?: string[] | null
          major_cities?: string[] | null
          name?: string
          native_species?: string[] | null
          natural_resources?: string[] | null
          notable_locations?: string[] | null
          population?: number | null
          system_id?: string | null
          technology_level?: string | null
          terrain?: string | null
          trade_specialties?: string[] | null
          type?: Database["public"]["Enums"]["planet_type"] | null
          updated_at?: string | null
          year_length_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planets_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          abundance: string | null
          annual_output: string | null
          controlled_by: string | null
          created_at: string | null
          environmental_impact: string | null
          extraction_difficulty: string | null
          extraction_methods: string[] | null
          id: string
          market_value: string | null
          planet_id: string | null
          reserves_estimated: string | null
          resource_name: string
          resource_type: Database["public"]["Enums"]["resource_type"] | null
          system_id: string | null
          updated_at: string | null
        }
        Insert: {
          abundance?: string | null
          annual_output?: string | null
          controlled_by?: string | null
          created_at?: string | null
          environmental_impact?: string | null
          extraction_difficulty?: string | null
          extraction_methods?: string[] | null
          id?: string
          market_value?: string | null
          planet_id?: string | null
          reserves_estimated?: string | null
          resource_name: string
          resource_type?: Database["public"]["Enums"]["resource_type"] | null
          system_id?: string | null
          updated_at?: string | null
        }
        Update: {
          abundance?: string | null
          annual_output?: string | null
          controlled_by?: string | null
          created_at?: string | null
          environmental_impact?: string | null
          extraction_difficulty?: string | null
          extraction_methods?: string[] | null
          id?: string
          market_value?: string | null
          planet_id?: string | null
          reserves_estimated?: string | null
          resource_name?: string
          resource_type?: Database["public"]["Enums"]["resource_type"] | null
          system_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_planet_id_fkey"
            columns: ["planet_id"]
            isOneToOne: false
            referencedRelation: "planets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          source_id: string
          summary: string | null
          total_word_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          source_id: string
          summary?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          source_id?: string
          summary?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      species: {
        Row: {
          average_height_cm: number | null
          average_lifespan_years: number | null
          classification: string | null
          created_at: string | null
          culture_summary: string | null
          distinctive_features: string | null
          force_sensitivity: string | null
          homeworld_id: string | null
          id: string
          language_family: string | null
          name: string
          notable_individuals: string[] | null
          physical_description: string | null
          society_structure: string | null
          technology_level: string | null
          updated_at: string | null
        }
        Insert: {
          average_height_cm?: number | null
          average_lifespan_years?: number | null
          classification?: string | null
          created_at?: string | null
          culture_summary?: string | null
          distinctive_features?: string | null
          force_sensitivity?: string | null
          homeworld_id?: string | null
          id?: string
          language_family?: string | null
          name: string
          notable_individuals?: string[] | null
          physical_description?: string | null
          society_structure?: string | null
          technology_level?: string | null
          updated_at?: string | null
        }
        Update: {
          average_height_cm?: number | null
          average_lifespan_years?: number | null
          classification?: string | null
          created_at?: string | null
          culture_summary?: string | null
          distinctive_features?: string | null
          force_sensitivity?: string | null
          homeworld_id?: string | null
          id?: string
          language_family?: string | null
          name?: string
          notable_individuals?: string[] | null
          physical_description?: string | null
          society_structure?: string | null
          technology_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "species_homeworld_id_fkey"
            columns: ["homeworld_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_relationships: {
        Row: {
          active_treaties: string[] | null
          created_at: string | null
          cultural_exchange: boolean | null
          description: string | null
          established_date: string | null
          id: string
          military_cooperation: boolean | null
          relationship_type:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          strength: number | null
          system_a_id: string | null
          system_b_id: string | null
          trade_volume_credits: number | null
          updated_at: string | null
        }
        Insert: {
          active_treaties?: string[] | null
          created_at?: string | null
          cultural_exchange?: boolean | null
          description?: string | null
          established_date?: string | null
          id?: string
          military_cooperation?: boolean | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          strength?: number | null
          system_a_id?: string | null
          system_b_id?: string | null
          trade_volume_credits?: number | null
          updated_at?: string | null
        }
        Update: {
          active_treaties?: string[] | null
          created_at?: string | null
          cultural_exchange?: boolean | null
          description?: string | null
          established_date?: string | null
          id?: string
          military_cooperation?: boolean | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          strength?: number | null
          system_a_id?: string | null
          system_b_id?: string | null
          trade_volume_credits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_relationships_system_a_id_fkey"
            columns: ["system_a_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_relationships_system_b_id_fkey"
            columns: ["system_b_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_routes: {
        Row: {
          controlling_faction: string | null
          created_at: string | null
          description: string | null
          destination_system_id: string | null
          established_date: string | null
          id: string
          intermediate_systems: string[] | null
          name: string
          origin_system_id: string | null
          primary_goods: string[] | null
          route_type: string | null
          safety_rating: number | null
          status: string | null
          travel_time_days: number | null
          updated_at: string | null
        }
        Insert: {
          controlling_faction?: string | null
          created_at?: string | null
          description?: string | null
          destination_system_id?: string | null
          established_date?: string | null
          id?: string
          intermediate_systems?: string[] | null
          name: string
          origin_system_id?: string | null
          primary_goods?: string[] | null
          route_type?: string | null
          safety_rating?: number | null
          status?: string | null
          travel_time_days?: number | null
          updated_at?: string | null
        }
        Update: {
          controlling_faction?: string | null
          created_at?: string | null
          description?: string | null
          destination_system_id?: string | null
          established_date?: string | null
          id?: string
          intermediate_systems?: string[] | null
          name?: string
          origin_system_id?: string | null
          primary_goods?: string[] | null
          route_type?: string | null
          safety_rating?: number | null
          status?: string | null
          travel_time_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_routes_destination_system_id_fkey"
            columns: ["destination_system_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_routes_origin_system_id_fkey"
            columns: ["origin_system_id"]
            isOneToOne: false
            referencedRelation: "galactic_systems"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_code_examples: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
          source_filter?: string
        }
        Returns: {
          id: number
          url: string
          chunk_number: number
          content: string
          summary: string
          metadata: Json
          source_id: string
          similarity: number
        }[]
      }
      match_crawled_pages: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
          source_filter?: string
        }
        Returns: {
          id: number
          url: string
          chunk_number: number
          content: string
          metadata: Json
          source_id: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      climate_type:
        | "temperate"
        | "tropical"
        | "arid"
        | "frozen"
        | "toxic"
        | "variable"
        | "artificial"
        | "unknown"
      event_type:
        | "battle"
        | "treaty"
        | "discovery"
        | "founding"
        | "destruction"
        | "liberation"
        | "occupation"
        | "rebellion"
      planet_type:
        | "terrestrial"
        | "gas_giant"
        | "ice_world"
        | "desert"
        | "ocean"
        | "volcanic"
        | "forest"
        | "urban"
        | "barren"
        | "asteroid"
      relationship_type:
        | "allied"
        | "enemy"
        | "neutral"
        | "trade_partner"
        | "vassal"
        | "rival"
        | "dependent"
      resource_type:
        | "mineral"
        | "energy"
        | "agricultural"
        | "technological"
        | "cultural"
        | "strategic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      climate_type: [
        "temperate",
        "tropical",
        "arid",
        "frozen",
        "toxic",
        "variable",
        "artificial",
        "unknown",
      ],
      event_type: [
        "battle",
        "treaty",
        "discovery",
        "founding",
        "destruction",
        "liberation",
        "occupation",
        "rebellion",
      ],
      planet_type: [
        "terrestrial",
        "gas_giant",
        "ice_world",
        "desert",
        "ocean",
        "volcanic",
        "forest",
        "urban",
        "barren",
        "asteroid",
      ],
      relationship_type: [
        "allied",
        "enemy",
        "neutral",
        "trade_partner",
        "vassal",
        "rival",
        "dependent",
      ],
      resource_type: [
        "mineral",
        "energy",
        "agricultural",
        "technological",
        "cultural",
        "strategic",
      ],
    },
  },
} as const
