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
// Scale: ±2000 units = 100,000 light-years (25 light-years per unit)
const REGION_BOUNDS: Record<string, RegionBounds> = {
  'Deep Core': { minRadius: 0, maxRadius: 100, minHeight: -20, maxHeight: 20 },
  'Core Worlds': { minRadius: 100, maxRadius: 200, minHeight: -30, maxHeight: 30 },
  'Colonies': { minRadius: 200, maxRadius: 350, minHeight: -40, maxHeight: 40 },
  'Inner Rim': { minRadius: 350, maxRadius: 500, minHeight: -50, maxHeight: 50 },
  'Expansion Region': { minRadius: 500, maxRadius: 750, minHeight: -60, maxHeight: 60 },
  'Mid Rim': { minRadius: 750, maxRadius: 1200, minHeight: -80, maxHeight: 80 },
  'Outer Rim Territories': { minRadius: 1200, maxRadius: 1800, minHeight: -100, maxHeight: 100 },
  'Outer Rim': { minRadius: 1200, maxRadius: 1800, minHeight: -100, maxHeight: 100 },
  'Wild Space': { minRadius: 1800, maxRadius: 2000, minHeight: -120, maxHeight: 120 },
  'Unknown Regions': { minRadius: 1800, maxRadius: 2000, minHeight: -120, maxHeight: 120 },
  'Hutt Space': { minRadius: 1400, maxRadius: 1900, minHeight: -90, maxHeight: 90 },
  'Corporate Sector': { minRadius: 800, maxRadius: 1300, minHeight: -85, maxHeight: 85 }
};

// Default bounds for unknown regions
const DEFAULT_BOUNDS: RegionBounds = { minRadius: 1000, maxRadius: 1800, minHeight: -100, maxHeight: 100 };

// Scale factor: 1 unit = 25 light-years (total disk = 100,000 light-years diameter)
const SCALE_FACTOR = 25;

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
 */
function letterToAngle(letter: string): number {
  const charCode = letter.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  // Map A-Z to angles from 0 to 2π
  return (charCode / 25) * Math.PI * 2;
}

/**
 * Convert number to radius from galactic center, adjusted by region
 */
function numberToRadius(number: number, region: string): number {
  const bounds = REGION_BOUNDS[region] || DEFAULT_BOUNDS;
  
  // Map numbers 1-24 to positions within the region's radius bounds
  const normalizedPosition = (number - 1) / 23; // 0 to 1
  return bounds.minRadius + (bounds.maxRadius - bounds.minRadius) * normalizedPosition;
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
  
  // Convert polar coordinates to Cartesian (X, Z for disk plane, Y for height)
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
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
    radius <= 2000 && // Within galactic disk radius (100,000 light-years)
    Math.abs(coords.y) <= 120    // Within galactic disk height
  );
}