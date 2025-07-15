// 3D Galactic Coordinate System
// Converts 2D galactic grid coordinates to 3D space coordinates in light-years

export interface GalacticCoordinates3D {
  x: number; // X coordinate in light-years
  y: number; // Y coordinate in light-years  
  z: number; // Z coordinate in light-years
}

export interface RegionZBounds {
  min: number;
  max: number;
}

// Z-axis bounds for different galactic regions (in light-years)
const REGION_Z_BOUNDS: Record<string, RegionZBounds> = {
  'Core Worlds': { min: -2500, max: 2500 },
  'Colonies': { min: -5000, max: 5000 },
  'Inner Rim': { min: -6000, max: 6000 },
  'Expansion Region': { min: -7000, max: 7000 },
  'Mid Rim': { min: -7500, max: 7500 },
  'Outer Rim': { min: -12500, max: 12500 },
  'Wild Space': { min: -20000, max: 20000 },
  'Unknown Regions': { min: -20000, max: 20000 },
  'Hutt Space': { min: -10000, max: 10000 },
  'Corporate Sector': { min: -8000, max: 8000 }
};

// Default Z bounds for unknown regions
const DEFAULT_Z_BOUNDS: RegionZBounds = { min: -15000, max: 15000 };

// Scale factor: 1 unit = 5000 light-years
const SCALE_FACTOR = 5000;

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
 * Convert letter to X coordinate (-65,000 to +65,000 light-years)
 */
function letterToX(letter: string): number {
  const charCode = letter.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
  // Map A-Z to positions from -65,000 to +65,000 light-years
  const normalizedPosition = (charCode / 25) * 2 - 1; // -1 to +1
  return normalizedPosition * 65000;
}

/**
 * Convert number to Y coordinate (-60,000 to +60,000 light-years) 
 */
function numberToY(number: number): number {
  // Map numbers 1-24 to positions from -60,000 to +60,000 light-years
  const normalizedPosition = ((number - 1) / 23) * 2 - 1; // -1 to +1
  return normalizedPosition * 60000;
}

/**
 * Calculate Z coordinate based on region and system properties
 */
function calculateZ(
  region: string,
  systemName: string,
  population?: number,
  classification?: string
): number {
  const bounds = REGION_Z_BOUNDS[region] || DEFAULT_Z_BOUNDS;
  
  // Use system name as seed for consistent positioning
  const seed = hashString(systemName + region);
  const baseRandom = seededRandom(seed);
  
  // Base Z position within region bounds
  let z = bounds.min + (bounds.max - bounds.min) * baseRandom;
  
  // Adjust Z based on population (more populated = closer to galactic plane)
  if (population && population > 0) {
    const populationFactor = Math.min(Math.log10(population) / 12, 1); // Normalize to 0-1
    const centeringEffect = (1 - populationFactor) * 0.3; // Up to 30% pull toward center
    z *= (1 - centeringEffect);
  }
  
  // Adjust Z based on classification
  if (classification) {
    const centralizedTypes = ['Capital', 'Trade Hub', 'Industrial', 'Core World'];
    const frontierTypes = ['Frontier', 'Mining', 'Agricultural', 'Backwater'];
    
    if (centralizedTypes.some(type => classification.includes(type))) {
      z *= 0.7; // Pull toward galactic plane
    } else if (frontierTypes.some(type => classification.includes(type))) {
      z *= 1.3; // Push away from galactic plane
    }
  }
  
  // Add controlled noise (±10% variation)
  const noiseSeed = hashString(systemName + 'noise');
  const noise = (seededRandom(noiseSeed) - 0.5) * 0.2; // -0.1 to +0.1
  z *= (1 + noise);
  
  // Ensure we stay within bounds
  return Math.max(bounds.min, Math.min(bounds.max, z));
}

/**
 * Convert 2D galactic grid coordinates to 3D space coordinates
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
  
  const x = letterToX(parsed.letter);
  const y = numberToY(parsed.number);
  const z = calculateZ(region, systemName, population, classification);
  
  return { x, y, z };
}

/**
 * Get region Z bounds for reference
 */
export function getRegionZBounds(region: string): RegionZBounds {
  return REGION_Z_BOUNDS[region] || DEFAULT_Z_BOUNDS;
}

/**
 * Validate if coordinates are within expected galactic bounds
 */
export function validateCoordinates(coords: GalacticCoordinates3D): boolean {
  return (
    Math.abs(coords.x) <= 70000 && // Within galactic disk
    Math.abs(coords.y) <= 65000 && // Within galactic disk  
    Math.abs(coords.z) <= 25000    // Within reasonable Z bounds
  );
}