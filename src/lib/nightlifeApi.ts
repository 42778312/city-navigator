/**
 * Nightlife API - Fetch and manage nightlife venues from OpenStreetMap
 * Uses Overpass API to query bars, pubs, and nightclubs in Konstanz, Germany
 */

import opening_hours from 'opening_hours';

export interface NightlifeVenue {
  id: string;
  name: string;
  type: 'bar' | 'pub' | 'nightclub';
  coordinates: [number, number]; // [lng, lat]
  openingHours?: string;
  intensity: number; // For heatmap weighting
  isOpen?: boolean;
  opensAt?: string;
  closesAt?: string;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    amenity?: string;
    opening_hours?: string;
    [key: string]: any;
  };
}

interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

/**
 * Overpass API query for nightlife venues in Konstanz
 * Uses bounding box for faster/more reliable results
 * Konstanz bbox: [47.64, 9.13, 47.71, 9.22]
 */
const OVERPASS_QUERY = `
[out:json][timeout:25];
(
  node["amenity"="bar"](47.64,9.13,47.71,9.22);
  node["amenity"="pub"](47.64,9.13,47.71,9.22);
  node["amenity"="nightclub"](47.64,9.13,47.71,9.22);
  way["amenity"="bar"](47.64,9.13,47.71,9.22);
  way["amenity"="pub"](47.64,9.13,47.71,9.22);
  way["amenity"="nightclub"](47.64,9.13,47.71,9.22);
);
out center tags;
`;

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_API_URL_FALLBACK = 'https://overpass.kumi.systems/api/interpreter';

// Mock data as fallback when API is unavailable
const MOCK_VENUES: NightlifeVenue[] = [
  {
    id: 'mock-1',
    name: 'Klimperkasten',
    type: 'bar',
    coordinates: [9.1732, 47.6605],
    intensity: 1,
    openingHours: 'Mo-Su 18:00-02:00',
    isOpen: true,
  },
  {
    id: 'mock-2',
    name: 'Kulturladen',
    type: 'nightclub',
    coordinates: [9.1795, 47.6615],
    intensity: 3,
    openingHours: 'Fr-Sa 22:00-04:00',
    isOpen: false,
  },
  {
    id: 'mock-3',
    name: 'Black Sheep Pub',
    type: 'pub',
    coordinates: [9.1765, 47.6595],
    intensity: 1.5,
    openingHours: 'Mo-Su 17:00-01:00',
    isOpen: true,
  },
  {
    id: 'mock-4',
    name: 'Seewolf',
    type: 'bar',
    coordinates: [9.1680, 47.6640],
    intensity: 1,
    isOpen: true,
  },
  {
    id: 'mock-5',
    name: 'Stadtgarten',
    type: 'nightclub',
    coordinates: [9.1750, 47.6580],
    intensity: 3,
    openingHours: 'Fr-Sa 23:00-05:00',
    isOpen: false,
  },
  {
    id: 'mock-6',
    name: 'Kult',
    type: 'bar',
    coordinates: [9.1820, 47.6620],
    intensity: 1,
    isOpen: true,
  },
];

/**
 * Fetch nightlife venues from Overpass API
 */
export async function fetchNightlifeVenues(): Promise<NightlifeVenue[]> {
  console.log('🌙 Fetching nightlife venues from Overpass API...');
  
  // Try primary API
  try {
    const venues = await fetchFromOverpass(OVERPASS_API_URL);
    if (venues.length > 0) {
      console.log(`✅ Received ${venues.length} venues from primary API`);
      return venues;
    }
  } catch (error) {
    console.warn('⚠️ Primary Overpass API failed:', error);
  }

  // Try fallback API
  try {
    console.log('🔄 Trying fallback Overpass API...');
    const venues = await fetchFromOverpass(OVERPASS_API_URL_FALLBACK);
    if (venues.length > 0) {
      console.log(`✅ Received ${venues.length} venues from fallback API`);
      return venues;
    }
  } catch (error) {
    console.warn('⚠️ Fallback Overpass API failed:', error);
  }

  // Use mock data as last resort
  console.warn('⚠️ All Overpass APIs failed, using mock data');
  return MOCK_VENUES;
}

/**
 * Fetch from specific Overpass instance
 */
async function fetchFromOverpass(apiUrl: string): Promise<NightlifeVenue[]> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data: OverpassResponse = await response.json();
  console.log(`📦 Overpass returned ${data.elements.length} raw elements`);

  // Convert Overpass elements to NightlifeVenue format
  const venues: NightlifeVenue[] = data.elements
    .map((element) => convertToVenue(element))
    .filter((venue): venue is NightlifeVenue => venue !== null);

  return venues;
}

/**
 * Convert Overpass element to NightlifeVenue
 */
function convertToVenue(element: OverpassElement): NightlifeVenue | null {
  const tags = element.tags;
  if (!tags) return null;

  // Get coordinates (node has lat/lon, way/relation has center)
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!lat || !lon) return null;

  const amenity = tags.amenity;
  if (!amenity || !['bar', 'pub', 'nightclub'].includes(amenity)) return null;

  const type = amenity as 'bar' | 'pub' | 'nightclub';
  
  // Calculate intensity for heatmap (nightclubs = highest)
  const intensity = type === 'nightclub' ? 3 : type === 'pub' ? 1.5 : 1;

  const venue: NightlifeVenue = {
    id: `${element.type}-${element.id}`,
    name: tags.name || 'Unnamed venue',
    type,
    coordinates: [lon, lat],
    openingHours: tags.opening_hours,
    intensity,
  };

  // Parse opening hours if available
  if (tags.opening_hours) {
    try {
      const openingStatus = parseOpeningHours(tags.opening_hours, lat, lon);
      venue.isOpen = openingStatus.isOpen;
      venue.opensAt = openingStatus.opensAt;
      venue.closesAt = openingStatus.closesAt;
    } catch (error) {
      console.warn(`Failed to parse opening hours for ${venue.name}:`, error);
    }
  }

  return venue;
}

/**
 * Parse opening hours using opening_hours.js library
 */
function parseOpeningHours(
  openingHoursString: string,
  lat: number,
  lon: number
): { isOpen: boolean; opensAt?: string; closesAt?: string } {
  try {
    const oh = new opening_hours(openingHoursString, {
      lat,
      lon,
      address: { 
        country_code: 'de',
        state: 'Baden-Württemberg'
      }
    });
    const now = new Date();
    const isOpen = oh.getState(now);

    let opensAt: string | undefined;
    let closesAt: string | undefined;

    if (isOpen) {
      // Get closing time
      const nextChange = oh.getNextChange(now);
      if (nextChange) {
        closesAt = formatTime(nextChange);
      }
    } else {
      // Get opening time
      const nextChange = oh.getNextChange(now);
      if (nextChange) {
        opensAt = formatTime(nextChange);
      }
    }

    return { isOpen, opensAt, closesAt };
  } catch (error) {
    // If parsing fails, assume open
    console.warn('Opening hours parsing failed:', error);
    return { isOpen: true };
  }
}

/**
 * Format Date to HH:mm string
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if current time is evening/night (for enhanced visualization)
 */
export function isEveningTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6; // 6 PM to 6 AM
}

/**
 * Get venue status text for display
 */
export function getVenueStatusText(venue: NightlifeVenue): string {
  if (venue.isOpen === undefined) {
    return 'Hours unknown';
  }

  if (venue.isOpen && venue.closesAt) {
    return `Open until ${venue.closesAt}`;
  }

  if (!venue.isOpen && venue.opensAt) {
    return `Closed • Opens at ${venue.opensAt}`;
  }

  return venue.isOpen ? 'Open' : 'Closed';
}

/**
 * Parse time string (HH:mm) to today's Date
 */
function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Convert venues to GeoJSON FeatureCollection
 */
export function venuesToGeoJSON(venues: NightlifeVenue[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: venues.map((venue) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: venue.coordinates,
      },
      properties: {
        id: venue.id,
        name: venue.name,
        type: venue.type,
        intensity: venue.intensity,
        isOpen: venue.isOpen ?? true,
        openingHours: venue.openingHours,
        opensAt: venue.opensAt,
        closesAt: venue.closesAt,
      },
    })),
  };
}
