// 3D Galactic Coordinate System
// Converts 2D galactic grid coordinates to 3D space coordinates in light-years

export interface GalacticCoordinates3D {
  x: number; // X coordinate in light-years
  y: number; // Y coordinate in light-years  
  z: number; // Z coordinate in light-years
}

// Galactic disk structure for realistic 3D positioning
export interface RegionBounds {
  minRadius: number; // Minimum distance from galactic center
  maxRadius: number; // Maximum distance from galactic center
  minHeight: number; // Minimum height above/below galactic plane
  maxHeight: number; // Maximum height above/below galactic plane
}

// Star Wars Galactic Regions - Concentric structure from Deep Core to Unknown Regions
// Scale: 1 unit ≈ 50 light-years for visualization (galaxy diameter ≈ 120,000 ly)
export interface RegionConfig extends RegionBounds {
  color: string;
  density: number;
  spiralArm?: number; // Which spiral arm this region favors (0-4)
}

const STAR_WARS_REGIONS: Record<string, RegionConfig> = {
  'Deep Core': { 
    minRadius: 0, maxRadius: 200, minHeight: -25, maxHeight: 25,
    color: '#FFD700', density: 0.8, spiralArm: undefined // Central, no spiral preference
  },
  'Core Worlds': { 
    minRadius: 200, maxRadius: 500, minHeight: -40, maxHeight: 40,
    color: '#FFA500', density: 0.7, spiralArm: undefined
  },
  'Colonies': { 
    minRadius: 500, maxRadius: 800, minHeight: -50, maxHeight: 50,
    color: '#9370DB', density: 0.6, spiralArm: 0
  },
  'Inner Rim': { 
    minRadius: 800, maxRadius: 1200, minHeight: -60, maxHeight: 60,
    color: '#DEB887', density: 0.5, spiralArm: 1
  },
  'Expansion Region': { 
    minRadius: 1200, maxRadius: 1500, minHeight: -70, maxHeight: 70,
    color: '#87CEEB', density: 0.4, spiralArm: 2
  },
  'Mid Rim': { 
    minRadius: 1500, maxRadius: 1800, minHeight: -75, maxHeight: 75,
    color: '#FFB6C1', density: 0.3, spiralArm: 3
  },
  'Outer Rim Territories': { 
    minRadius: 1800, maxRadius: 2200, minHeight: -80, maxHeight: 80,
    color: '#4682B4', density: 0.2, spiralArm: 4
  },
  'Wild Space': { 
    minRadius: 2200, maxRadius: 2600, minHeight: -90, maxHeight: 90,
    color: '#696969', density: 0.1, spiralArm: undefined
  },
  'Unknown Regions': { 
    minRadius: 2600, maxRadius: 3000, minHeight: -100, maxHeight: 100,
    color: '#483D8B', density: 0.05, spiralArm: undefined
  },
  'Hutt Space': { 
    minRadius: 1600, maxRadius: 1900, minHeight: -75, maxHeight: 75,
    color: '#8B4513', density: 0.25, spiralArm: 3
  },
  'Corporate Sector': { 
    minRadius: 1400, maxRadius: 1700, minHeight: -70, maxHeight: 70,
    color: '#2F4F4F', density: 0.3, spiralArm: 2
  }
};

// Legacy compatibility - convert to old format
const REGION_BOUNDS: Record<string, RegionBounds> = Object.fromEntries(
  Object.entries(STAR_WARS_REGIONS).map(([key, config]) => [
    key, 
    {
      minRadius: config.minRadius,
      maxRadius: config.maxRadius,
      minHeight: config.minHeight,
      maxHeight: config.maxHeight
    }
  ])
);

// Default bounds for unknown regions
const DEFAULT_BOUNDS: RegionBounds = { minRadius: 12500, maxRadius: 22500, minHeight: -1250, maxHeight: 1250 };

// Scale factor: 1 unit ≈ 2 light-years (total disk ≈ 100,000 light-years diameter)
const SCALE_FACTOR = 2;

/**
 * Simple hash function to generate consistent pseudo-random numbers from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate consistent pseudo-random number between 0 and 1 based on seed
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Parse galactic grid coordinates (e.g., "L-9", "M-12")
 */
function parseGridCoordinates(gridCoords: string): { letter: string; number: number } | null {
  const match = gridCoords.match(/^([A-Z])-?(\d+)$/i);
  if (!match) return null;
  
  return {
    letter: match[1].toUpperCase(),
    number: parseInt(match[2], 10)
  };
}

/**
 * Convert letter to angle in the galactic disk (0 to 2π radians)
 * **FIXED**: Correctly divides by 26 (not 25) for uniform A-Z distribution
 */
function letterToAngle(letter: string): number {
  const charCode = letter.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  // **CORRECTED**: Map A-Z uniformly across 0 to 2π (26 letters, not 25)
  return (charCode / 26) * Math.PI * 2;
}

/**
 * Convert number to radius from galactic center, adjusted by region
 * **ENHANCED**: Optimized distribution with spiral arm influence and clustering
 */
function numberToRadius(number: number, region: string): number {
  const bounds = REGION_BOUNDS[region] || DEFAULT_BOUNDS;
  
  // **OPTIMIZED**: Use 0-23 range for better distribution
  const normalizedPosition = Math.max(0, Math.min(1, (number - 1) / 23)); // Clamp to 0-1
  
  // Add slight non-linear distribution for more realistic clustering
  // Systems tend to cluster in certain radial bands (spiral arms)
  const clusteredPosition = normalizedPosition + 
    Math.sin(normalizedPosition * Math.PI * 6) * 0.05; // ±5% spiral influence
  
  return bounds.minRadius + (bounds.maxRadius - bounds.minRadius) * 
    Math.max(0, Math.min(1, clusteredPosition));
}

/**
 * Calculate Y coordinate (height above/below galactic plane) based on region and system properties
 */
function calculateHeight(
  region: string,
  systemName: string,
  population?: number,
  classification?: string
): number {
  const bounds = REGION_BOUNDS[region] || DEFAULT_BOUNDS;
  
  // Use system name as seed for consistent positioning
  const seed = hashString(systemName + region);
  const baseRandom = seededRandom(seed);
  
  // Base Y position within region height bounds
  let y = bounds.minHeight + (bounds.maxHeight - bounds.minHeight) * baseRandom;
  
  // Adjust Y based on population (more populated = closer to galactic plane)
  if (population && population > 0) {
    const populationFactor = Math.min(Math.log10(population) / 12, 1); // Normalize to 0-1
    const centeringEffect = populationFactor * 0.4; // Up to 40% pull toward center
    y *= (1 - centeringEffect);
  }
  
  // Adjust Y based on classification
  if (classification) {
    const centralizedTypes = ['Capital', 'Trade Hub', 'Industrial', 'Core World'];
    const frontierTypes = ['Frontier', 'Mining', 'Agricultural', 'Backwater'];
    
    if (centralizedTypes.some(type => classification.includes(type))) {
      y *= 0.6; // Pull toward galactic plane
    } else if (frontierTypes.some(type => classification.includes(type))) {
      y *= 1.4; // Push away from galactic plane
    }
  }
  
  // Add controlled noise (±15% variation)
  const noiseSeed = hashString(systemName + 'height');
  const noise = (seededRandom(noiseSeed) - 0.5) * 0.3; // -0.15 to +0.15
  y *= (1 + noise);
  
  // Ensure we stay within bounds
  return Math.max(bounds.minHeight, Math.min(bounds.maxHeight, y));
}

/**
 * Convert 2D galactic grid coordinates to 3D galactic disk coordinates
 */
export function galacticCoordinatesToXYZ(
  gridCoordinates: string,
  region: string,
  systemName: string,
  population?: number,
  classification?: string
): GalacticCoordinates3D | null {
  const parsed = parseGridCoordinates(gridCoordinates);
  if (!parsed) {
    console.warn(`Invalid grid coordinates: ${gridCoordinates}`);
    return null;
  }
  
  // Convert 2D coordinates to galactic disk position
  const angle = letterToAngle(parsed.letter);
  const radius = numberToRadius(parsed.number, region);
  const height = calculateHeight(region, systemName, population, classification);
  
  // **STAR WARS**: Five-arm spiral galaxy structure
  const spiralArms = 5;
  const regionConfig = STAR_WARS_REGIONS[region];
  let spiralOffset = 0;
  
  if (regionConfig?.spiralArm !== undefined) {
    // Systems in this region prefer a specific spiral arm
    const preferredArmAngle = (regionConfig.spiralArm * 2 * Math.PI) / spiralArms;
    const spiralTightness = 0.0008; // How tightly wound the spiral is
    const armCurve = radius * spiralTightness;
    
    // Calculate the angle offset for this spiral arm at this radius
    const armAngleAtRadius = preferredArmAngle + armCurve;
    
    // Apply spiral bias - systems tend to cluster along spiral arms
    const spiralBias = Math.cos(angle - armAngleAtRadius) * 0.15; // ±15% radius adjustment
    spiralOffset = spiralBias * radius;
    
    // Add some randomness to prevent perfect alignment
    const randomness = (seededRandom(hashString(systemName + 'spiral')) - 0.5) * 0.05 * radius;
    spiralOffset += randomness;
  }
  
  // Convert polar coordinates to Cartesian (X, Z for disk plane, Y for height)
  const x = Math.cos(angle) * (radius + spiralOffset);
  const z = Math.sin(angle) * (radius + spiralOffset);
  const y = height;
  
  return { x, y, z };
}

/**
 * Get region bounds for reference
 */
export function getRegionBounds(region: string): RegionBounds {
  return REGION_BOUNDS[region] || DEFAULT_BOUNDS;
}

/**
 * Get full region configuration including color and spiral arm data
 */
export function getRegionConfig(region: string): RegionConfig {
  return STAR_WARS_REGIONS[region] || { 
    ...DEFAULT_BOUNDS, 
    color: '#FFFFFF', 
    density: 0.1 
  };
}

/**
 * Get all region configurations for visualization
 */
export function getAllRegionConfigs(): Record<string, RegionConfig> {
  return STAR_WARS_REGIONS;
}

/**
 * Generate spiral arm coordinates for visualization
 */
export function generateSpiralArmPoints(armIndex: number, maxRadius: number = 3000): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = [];
  const spiralArms = 5;
  const baseAngle = (armIndex * 2 * Math.PI) / spiralArms;
  const spiralTightness = 0.0008;
  
  for (let radius = 300; radius <= maxRadius; radius += 50) {
    const angle = baseAngle + radius * spiralTightness;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.sin(radius * 0.01) * 10) - 5; // Slight vertical wave
    
    points.push([x, y, z]);
  }
  
  return points;
}

/**
 * Validate if coordinates are within expected galactic disk bounds
 */
export function validateCoordinates(coords: GalacticCoordinates3D): boolean {
  const radius = Math.sqrt(coords.x * coords.x + coords.z * coords.z);
  return (
    radius <= 25000 && // **CORRECTED**: Within realistic galactic disk radius (~50,000 light-years)
    Math.abs(coords.y) <= 1500    // **CORRECTED**: Within realistic galactic disk height (~3,000 light-years)
  );
}