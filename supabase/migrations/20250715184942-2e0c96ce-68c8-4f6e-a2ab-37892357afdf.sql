-- Create enum types for better data consistency
CREATE TYPE planet_type AS ENUM ('terrestrial', 'gas_giant', 'ice_world', 'desert', 'ocean', 'volcanic', 'forest', 'urban', 'barren', 'asteroid');
CREATE TYPE climate_type AS ENUM ('temperate', 'tropical', 'arid', 'frozen', 'toxic', 'variable', 'artificial', 'unknown');
CREATE TYPE relationship_type AS ENUM ('allied', 'enemy', 'neutral', 'trade_partner', 'vassal', 'rival', 'dependent');
CREATE TYPE event_type AS ENUM ('battle', 'treaty', 'discovery', 'founding', 'destruction', 'liberation', 'occupation', 'rebellion');
CREATE TYPE resource_type AS ENUM ('mineral', 'energy', 'agricultural', 'technological', 'cultural', 'strategic');

-- Enhanced planets table with detailed information
CREATE TABLE public.planets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id UUID REFERENCES public.galactic_systems(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type planet_type,
    climate climate_type,
    diameter_km INTEGER,
    gravity_standard DECIMAL(3,2), -- compared to standard gravity
    atmosphere TEXT,
    hydrosphere_percentage INTEGER CHECK (hydrosphere_percentage >= 0 AND hydrosphere_percentage <= 100),
    day_length_hours DECIMAL(6,2),
    year_length_days DECIMAL(8,2),
    population BIGINT,
    government_type TEXT,
    major_cities TEXT[],
    terrain TEXT,
    native_species TEXT[],
    imported_species TEXT[],
    flora_fauna TEXT,
    natural_resources TEXT[],
    technology_level TEXT,
    trade_specialties TEXT[],
    notable_locations TEXT[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Species catalog
CREATE TABLE public.species (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    classification TEXT, -- humanoid, mammalian, reptilian, etc.
    homeworld_id UUID REFERENCES public.galactic_systems(id),
    average_height_cm INTEGER,
    average_lifespan_years INTEGER,
    language_family TEXT,
    distinctive_features TEXT,
    culture_summary TEXT,
    force_sensitivity TEXT, -- none, rare, common, strong
    notable_individuals TEXT[],
    physical_description TEXT,
    society_structure TEXT,
    technology_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Historical events tied to systems and planets
CREATE TABLE public.historical_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    event_type event_type,
    start_date TEXT, -- BBY/ABY format
    end_date TEXT,
    system_id UUID REFERENCES public.galactic_systems(id),
    planet_id UUID REFERENCES public.planets(id),
    participants TEXT[], -- factions, species, individuals involved
    outcome TEXT,
    significance TEXT,
    description TEXT,
    related_events UUID[], -- references to other event IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trade routes connecting systems
CREATE TABLE public.trade_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    origin_system_id UUID REFERENCES public.galactic_systems(id),
    destination_system_id UUID REFERENCES public.galactic_systems(id),
    intermediate_systems UUID[], -- array of system IDs
    route_type TEXT, -- hyperspace_lane, secondary_route, smuggling_route
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 10),
    travel_time_days DECIMAL(6,2),
    primary_goods TEXT[],
    controlling_faction TEXT,
    established_date TEXT,
    status TEXT, -- active, defunct, dangerous, restricted
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Relationships between systems (political, military, economic)
CREATE TABLE public.system_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_a_id UUID REFERENCES public.galactic_systems(id),
    system_b_id UUID REFERENCES public.galactic_systems(id),
    relationship_type relationship_type,
    strength INTEGER CHECK (strength >= 1 AND strength <= 10), -- 1=weak, 10=strong
    established_date TEXT,
    description TEXT,
    active_treaties TEXT[],
    trade_volume_credits BIGINT,
    military_cooperation BOOLEAN DEFAULT false,
    cultural_exchange BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(system_a_id, system_b_id, relationship_type)
);

-- Resources available in systems/planets
CREATE TABLE public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_id UUID REFERENCES public.galactic_systems(id),
    planet_id UUID REFERENCES public.planets(id),
    resource_name TEXT NOT NULL,
    resource_type resource_type,
    abundance TEXT, -- abundant, common, rare, extremely_rare
    extraction_difficulty TEXT, -- easy, moderate, difficult, extremely_difficult
    market_value TEXT, -- low, moderate, high, priceless
    controlled_by TEXT, -- faction controlling extraction
    annual_output TEXT,
    reserves_estimated TEXT,
    extraction_methods TEXT[],
    environmental_impact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notable locations within planets
CREATE TABLE public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    planet_id UUID REFERENCES public.planets(id),
    system_id UUID REFERENCES public.galactic_systems(id),
    name TEXT NOT NULL,
    location_type TEXT, -- city, spaceport, temple, fortress, ruins, etc.
    coordinates_lat DECIMAL(9,6),
    coordinates_lon DECIMAL(9,6),
    population BIGINT,
    controlling_faction TEXT,
    founding_date TEXT,
    architectural_style TEXT,
    notable_features TEXT[],
    economic_importance TEXT,
    strategic_value TEXT,
    historical_significance TEXT,
    access_restrictions TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to planets" ON public.planets FOR SELECT USING (true);
CREATE POLICY "Allow public read access to species" ON public.species FOR SELECT USING (true);
CREATE POLICY "Allow public read access to historical_events" ON public.historical_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access to trade_routes" ON public.trade_routes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to system_relationships" ON public.system_relationships FOR SELECT USING (true);
CREATE POLICY "Allow public read access to resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow public read access to locations" ON public.locations FOR SELECT USING (true);

-- Create policies for authenticated users to modify data
CREATE POLICY "Authenticated users can insert planets" ON public.planets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update planets" ON public.planets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert species" ON public.species FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update species" ON public.species FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert historical_events" ON public.historical_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update historical_events" ON public.historical_events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert trade_routes" ON public.trade_routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update trade_routes" ON public.trade_routes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert system_relationships" ON public.system_relationships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update system_relationships" ON public.system_relationships FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert resources" ON public.resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update resources" ON public.resources FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert locations" ON public.locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update locations" ON public.locations FOR UPDATE USING (auth.role() = 'authenticated');

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_planets_updated_at BEFORE UPDATE ON public.planets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_species_updated_at BEFORE UPDATE ON public.species FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_historical_events_updated_at BEFORE UPDATE ON public.historical_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trade_routes_updated_at BEFORE UPDATE ON public.trade_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_relationships_updated_at BEFORE UPDATE ON public.system_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_planets_system_id ON public.planets(system_id);
CREATE INDEX idx_planets_type ON public.planets(type);
CREATE INDEX idx_species_homeworld_id ON public.species(homeworld_id);
CREATE INDEX idx_historical_events_system_id ON public.historical_events(system_id);
CREATE INDEX idx_historical_events_planet_id ON public.historical_events(planet_id);
CREATE INDEX idx_historical_events_type ON public.historical_events(event_type);
CREATE INDEX idx_trade_routes_origin ON public.trade_routes(origin_system_id);
CREATE INDEX idx_trade_routes_destination ON public.trade_routes(destination_system_id);
CREATE INDEX idx_system_relationships_system_a ON public.system_relationships(system_a_id);
CREATE INDEX idx_system_relationships_system_b ON public.system_relationships(system_b_id);
CREATE INDEX idx_resources_system_id ON public.resources(system_id);
CREATE INDEX idx_resources_planet_id ON public.resources(planet_id);
CREATE INDEX idx_locations_planet_id ON public.locations(planet_id);
CREATE INDEX idx_locations_system_id ON public.locations(system_id);