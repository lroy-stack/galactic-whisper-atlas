export interface StarSystem {
  id: string;
  name: string;
  coordinates: [number, number, number];
  region: GalacticRegion;
  sector?: string;
  galacticCoordinates: string;
  classification: SystemType;
  population?: number;
  allegiance?: Faction;
  significance: number; // 1-10 scale
  description: string;
  planets: Planet[];
}

export interface Planet {
  name: string;
  type: PlanetType;
  population?: number;
  climate?: string;
  terrain?: string;
  species?: string[];
  significance?: number;
}

export type GalacticRegion = 
  | 'Deep Core'
  | 'Core Worlds'
  | 'Colonies'
  | 'Inner Rim'
  | 'Expansion Region'
  | 'Mid Rim'
  | 'Outer Rim Territories'
  | 'Wild Space'
  | 'Unknown Regions';

export type SystemType = 
  | 'Capital'
  | 'Major World'
  | 'Trade Hub'
  | 'Industrial'
  | 'Agricultural'
  | 'Mining'
  | 'Military'
  | 'Frontier'
  | 'Abandoned';

export type PlanetType = 
  | 'Urban'
  | 'Desert'
  | 'Forest'
  | 'Ocean'
  | 'Ice'
  | 'Volcanic'
  | 'Gas Giant'
  | 'Swamp'
  | 'Rocky';

export type Faction = 
  | 'Galactic Republic'
  | 'Galactic Empire'
  | 'Rebel Alliance'
  | 'New Republic'
  | 'First Order'
  | 'Resistance'
  | 'Hutt Cartel'
  | 'Independent'
  | 'Unknown';

export const GALACTIC_REGIONS: Record<GalacticRegion, { color: string; description: string }> = {
  'Deep Core': {
    color: '#FFD700',
    description: 'The galactic center, heavily populated and industrialized'
  },
  'Core Worlds': {
    color: '#FFA500',
    description: 'The heart of galactic civilization and government'
  },
  'Colonies': {
    color: '#87CEEB',
    description: 'First expansion beyond the Core Worlds'
  },
  'Inner Rim': {
    color: '#98FB98',
    description: 'Wealthy and well-established worlds'
  },
  'Expansion Region': {
    color: '#DDA0DD',
    description: 'Second wave of galactic expansion'
  },
  'Mid Rim': {
    color: '#F0E68C',
    description: 'The galactic middle class'
  },
  'Outer Rim Territories': {
    color: '#CD853F',
    description: 'Frontier worlds and lawless space'
  },
  'Wild Space': {
    color: '#696969',
    description: 'Unexplored and dangerous regions'
  },
  'Unknown Regions': {
    color: '#483D8B',
    description: 'Mysterious and largely uncharted space'
  }
};

export const STAR_SYSTEMS: StarSystem[] = [
  {
    id: 'coruscant',
    name: 'Coruscant',
    coordinates: [0, 0, 0],
    region: 'Core Worlds',
    sector: 'Coruscant Sector',
    galacticCoordinates: 'L-9',
    classification: 'Capital',
    population: 1000000000000,
    allegiance: 'Galactic Republic',
    significance: 10,
    description: 'The galactic capital, an ecumenopolis covering the entire planet surface.',
    planets: [{
      name: 'Coruscant',
      type: 'Urban',
      population: 1000000000000,
      climate: 'Temperate',
      terrain: 'Urban cityscape',
      species: ['Human', 'Various'],
      significance: 10
    }]
  },
  {
    id: 'tatooine',
    name: 'Tatooine',
    coordinates: [45, -15, 25],
    region: 'Outer Rim Territories',
    sector: 'Arkanis Sector',
    galacticCoordinates: 'R-16',
    classification: 'Frontier',
    population: 200000,
    allegiance: 'Hutt Cartel',
    significance: 8,
    description: 'Desert world with twin suns, birthplace of Anakin and Luke Skywalker.',
    planets: [{
      name: 'Tatooine',
      type: 'Desert',
      population: 200000,
      climate: 'Arid',
      terrain: 'Desert',
      species: ['Human', 'Jawa', 'Tusken Raider'],
      significance: 8
    }]
  },
  {
    id: 'alderaan',
    name: 'Alderaan',
    coordinates: [-20, 10, -15],
    region: 'Core Worlds',
    sector: 'Alderaan Sector',
    galacticCoordinates: 'M-10',
    classification: 'Major World',
    population: 0, // Destroyed
    allegiance: 'Rebel Alliance',
    significance: 9,
    description: 'Former peaceful world, destroyed by the Death Star. Home of Princess Leia.',
    planets: [{
      name: 'Alderaan',
      type: 'Forest',
      population: 0,
      climate: 'Temperate',
      terrain: 'Mountains, grasslands',
      species: ['Human'],
      significance: 9
    }]
  },
  {
    id: 'naboo',
    name: 'Naboo',
    coordinates: [-25, -5, 20],
    region: 'Mid Rim',
    sector: 'Chommell Sector',
    galacticCoordinates: 'O-17',
    classification: 'Major World',
    population: 600000000,
    allegiance: 'Galactic Republic',
    significance: 8,
    description: 'Beautiful world with underwater Gungan cities, homeworld of Padmé Amidala.',
    planets: [{
      name: 'Naboo',
      type: 'Forest',
      population: 600000000,
      climate: 'Temperate',
      terrain: 'Grassy hills, swamps',
      species: ['Human', 'Gungan'],
      significance: 8
    }]
  },
  {
    id: 'kamino',
    name: 'Kamino',
    coordinates: [30, 20, -35],
    region: 'Wild Space',
    sector: 'Kamino Sector',
    galacticCoordinates: 'S-15',
    classification: 'Military',
    population: 1000000000,
    allegiance: 'Galactic Republic',
    significance: 7,
    description: 'Ocean world, home to the Kaminoan cloners who created the Clone Army.',
    planets: [{
      name: 'Kamino',
      type: 'Ocean',
      population: 1000000000,
      climate: 'Temperate',
      terrain: 'Ocean, platforms',
      species: ['Kaminoan'],
      significance: 7
    }]
  },
  {
    id: 'geonosis',
    name: 'Geonosis',
    coordinates: [35, -20, 30],
    region: 'Outer Rim Territories',
    sector: 'Arkanis Sector',
    galacticCoordinates: 'R-16',
    classification: 'Industrial',
    population: 100000000,
    allegiance: 'Independent',
    significance: 6,
    description: 'Rocky desert world, home to the Geonosians and site of first Clone Wars battle.',
    planets: [{
      name: 'Geonosis',
      type: 'Rocky',
      population: 100000000,
      climate: 'Arid',
      terrain: 'Rock arches, mesas',
      species: ['Geonosian'],
      significance: 6
    }]
  },
  {
    id: 'mustafar',
    name: 'Mustafar',
    coordinates: [40, -30, 15],
    region: 'Outer Rim Territories',
    sector: 'Atravis Sector',
    galacticCoordinates: 'L-19',
    classification: 'Mining',
    population: 20000,
    allegiance: 'Independent',
    significance: 7,
    description: 'Volcanic world where Anakin became Darth Vader.',
    planets: [{
      name: 'Mustafar',
      type: 'Volcanic',
      population: 20000,
      climate: 'Hot',
      terrain: 'Lava rivers, volcanic',
      species: ['Mustafarian'],
      significance: 7
    }]
  },
  {
    id: 'kashyyyk',
    name: 'Kashyyyk',
    coordinates: [-10, 25, 30],
    region: 'Mid Rim',
    sector: 'Mytaranor Sector',
    galacticCoordinates: 'P-9',
    classification: 'Major World',
    population: 45000000,
    allegiance: 'Galactic Republic',
    significance: 6,
    description: 'Forest world, homeworld of the Wookiees including Chewbacca.',
    planets: [{
      name: 'Kashyyyk',
      type: 'Forest',
      population: 45000000,
      climate: 'Temperate',
      terrain: 'Forests, beaches',
      species: ['Wookiee'],
      significance: 6
    }]
  },
  {
    id: 'dagobah',
    name: 'Dagobah',
    coordinates: [-35, -25, -20],
    region: 'Outer Rim Territories',
    sector: 'Sluis Sector',
    galacticCoordinates: 'M-19',
    classification: 'Frontier',
    population: 1,
    allegiance: 'Independent',
    significance: 8,
    description: 'Swamp world where Yoda lived in exile and trained Luke Skywalker.',
    planets: [{
      name: 'Dagobah',
      type: 'Swamp',
      population: 1,
      climate: 'Humid',
      terrain: 'Swamps, bogs',
      species: ['Various creatures'],
      significance: 8
    }]
  },
  {
    id: 'hoth',
    name: 'Hoth',
    coordinates: [-40, 30, -25],
    region: 'Outer Rim Territories',
    sector: 'Anoat Sector',
    galacticCoordinates: 'K-18',
    classification: 'Frontier',
    population: 0,
    allegiance: 'Rebel Alliance',
    significance: 7,
    description: 'Ice world that served as the Rebel Alliance base during the Galactic Civil War.',
    planets: [{
      name: 'Hoth',
      type: 'Ice',
      population: 0,
      climate: 'Frozen',
      terrain: 'Tundra, ice caves',
      species: ['Wampa', 'Tauntaun'],
      significance: 7
    }]
  }
];

export const TRADE_ROUTES = [
  {
    name: 'Corellian Run',
    systems: ['coruscant', 'alderaan', 'naboo'],
    significance: 10,
    description: 'One of the most important trade routes in the galaxy'
  },
  {
    name: 'Hydian Way',
    systems: ['coruscant', 'tatooine', 'geonosis'],
    significance: 8,
    description: 'Major trade route connecting Core to Outer Rim'
  }
];