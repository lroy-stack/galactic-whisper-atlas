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

// Define galactic disk structure for each region
// **FIXED SCALE**: Realistic galactic proportions (1 unit ≈ 2 light-years)
// Total galaxy diameter: ~50,000 units (≈100,000 light-years)
const REGION_BOUNDS: Record<string, RegionBounds> = {
  'Deep Core': { minRadius: 0, maxRadius: 1250, minHeight: -250, maxHeight: 250 },
  'Core Worlds': { minRadius: 1250, maxRadius: 2500, minHeight: -375, maxHeight: 375 },
  'Colonies': { minRadius: 2500, maxRadius: 4375, minHeight: -500, maxHeight: 500 },
  'Inner Rim': { minRadius: 4375, maxRadius: 6250, minHeight: -625, maxHeight: 625 },
  'Expansion Region': { minRadius: 6250, maxRadius: 9375, minHeight: -750, maxHeight: 750 },
  'Mid Rim': { minRadius: 9375, maxRadius: 15000, minHeight: -1000, maxHeight: 1000 },
  'Outer Rim Territories': { minRadius: 15000, maxRadius: 22500, minHeight: -1250, maxHeight: 1250 },
  'Outer Rim': { minRadius: 15000, maxRadius: 22500, minHeight: -1250, maxHeight: 1250 },
  'Wild Space': { minRadius: 22500, maxRadius: 25000, minHeight: -1500, maxHeight: 1500 },
  'Unknown Regions': { minRadius: 22500, maxRadius: 25000, minHeight: -1500, maxHeight: 1500 },
  'Hutt Space': { minRadius: 17500, maxRadius: 23750, minHeight: -1125, maxHeight: 1125 },
  'Corporate Sector': { minRadius: 10000, maxRadius: 16250, minHeight: -1063, maxHeight: 1063 }
};

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
  
  // **ENHANCED**: Add subtle spiral arm structure to galactic disk
  const spiralInfluence = 0.02; // 2% spiral effect
  const spiralArms = 2; // Two-arm spiral galaxy
  const spiralOffset = Math.sin(angle * spiralArms + radius * 0.0001) * spiralInfluence * radius;
  
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
 * Validate if coordinates are within expected galactic disk bounds
 */
export function validateCoordinates(coords: GalacticCoordinates3D): boolean {
  const radius = Math.sqrt(coords.x * coords.x + coords.z * coords.z);
  return (
    radius <= 25000 && // **CORRECTED**: Within realistic galactic disk radius (~50,000 light-years)
    Math.abs(coords.y) <= 1500    // **CORRECTED**: Within realistic galactic disk height (~3,000 light-years)
  );
}