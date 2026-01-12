/**
 * Photon Geocoding API Service
 * 
 * Provides address autocomplete functionality using OpenStreetMap data
 * via the Photon API (https://photon.komoot.io/)
 * 
 * @module photonApi
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const PHOTON_API_URL = 'https://photon.komoot.io/api/';
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_DELAY = 300;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
export interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    osm_id: number;
    osm_type: string;
    osm_key: string;
    osm_value: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
}

export interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

/**
 * Structured address data for display and storage
 */
export interface AddressResult {
  // Original data
  raw: PhotonFeature;
  
  // Formatted display
  displayLine1: string; // e.g., "Hauptstraße 123"
  displayLine2: string; // e.g., "10115 Berlin, Deutschland"
  fullAddress: string;  // Complete formatted address
  
  // Structured components
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  
  // Coordinates (required for route calculation)
  latitude: number;
  longitude: number;
}

/**
 * Search parameters for Photon API
 */
export interface PhotonSearchParams {
  q: string;           // Query string
  lang?: string;       // Language code (default: 'de')
  limit?: number;      // Number of results (default: 10)
  lat?: number;        // Latitude for location bias
  lon?: number;        // Longitude for location bias
  bbox?: string;       // Bounding box for geographic filtering
  osm_tag?: string;    // OSM tag filtering
}

/**
 * Format a Photon feature into a structured address
 */
export function formatPhotonAddress(feature: PhotonFeature): AddressResult {
  const props = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;

  // Build display - prioritize showing place name with address
  let displayLine1 = '';
  let displayLine2 = '';
  
  // If there's a place name (business, landmark, etc.), show it prominently
  if (props.name && (props.street || props.city)) {
    // Line 1: Place name
    displayLine1 = props.name;
    
    // Line 2: Street address or city
    const addressParts: string[] = [];
    if (props.street) {
      let streetAddr = props.street;
      if (props.housenumber) {
        streetAddr += ` ${props.housenumber}`;
      }
      addressParts.push(streetAddr);
    }
    if (props.postcode) {
      addressParts.push(props.postcode);
    }
    if (props.city) {
      addressParts.push(props.city);
    }
    displayLine2 = addressParts.join(', ') || 'Konstanz';
  } 
  // If only street address (no specific place name)
  else if (props.street) {
    // Line 1: Street + house number
    displayLine1 = props.street;
    if (props.housenumber) {
      displayLine1 += ` ${props.housenumber}`;
    }
    
    // Line 2: PLZ + City
    const locationParts: string[] = [];
    if (props.postcode) {
      locationParts.push(props.postcode);
    }
    if (props.city) {
      locationParts.push(props.city);
    } else if (props.district) {
      locationParts.push(props.district);
    }
    displayLine2 = locationParts.join(' ') || 'Konstanz';
  }
  // If only place name (no street)
  else if (props.name) {
    displayLine1 = props.name;
    const locationParts: string[] = [];
    if (props.postcode) {
      locationParts.push(props.postcode);
    }
    if (props.city) {
      locationParts.push(props.city);
    } else if (props.district) {
      locationParts.push(props.district);
    }
    displayLine2 = locationParts.join(' ') || 'Konstanz';
  }
  // Fallback
  else {
    displayLine1 = 'Adresse';
    displayLine2 = props.city || 'Konstanz';
  }

  // Full address
  const fullAddress = `${displayLine1}, ${displayLine2}`;

  return {
    raw: feature,
    displayLine1,
    displayLine2,
    fullAddress,
    street: props.street,
    houseNumber: props.housenumber,
    postalCode: props.postcode,
    city: props.city,
    district: props.district,
    state: props.state,
    country: props.country,
    latitude,
    longitude,
  };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Search for addresses using Photon API
 * 
 * @param query - Search query (minimum 3 characters)
 * @param options - Additional search parameters
 * @returns Promise with formatted address results
 */
export async function searchAddress(
  query: string,
  options: Partial<PhotonSearchParams> = {}
): Promise<AddressResult[]> {
  // Validate minimum query length
  if (query.length < MIN_QUERY_LENGTH) {
    return [];
  }

  // Build query parameters
  const params = new URLSearchParams({
    q: query,
    lang: options.lang || 'de',
    limit: String(options.limit || 10),
  });

  // Add location bias (bias results towards Landkreis Konstanz)
  // Using coordinates for center of Konstanz
  if (options.lat !== undefined && options.lon !== undefined) {
    params.append('lat', String(options.lat));
    params.append('lon', String(options.lon));
  } else {
    // Default bias to Konstanz (city center)
    params.append('lat', '47.6779');
    params.append('lon', '9.1732');
  }

  // Add bounding box for Landkreis Konstanz to restrict results
  // Landkreis Konstanz bounds: [8.65E, 47.55N, 9.35E, 47.85N]
  if (!options.bbox) {
    params.append('bbox', '8.65,47.55,9.35,47.85');
  }

  try {
    const response = await fetch(`${PHOTON_API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status} ${response.statusText}`);
    }

    const data: PhotonResponse = await response.json();

    // Prioritize results by location relevance
    const scoredResults = data.features.map(feature => {
      const props = feature.properties;
      let score = 0;
      
      // Highest priority: Within Landkreis Konstanz
      const cityLower = props.city?.toLowerCase() || '';
      const districtLower = props.district?.toLowerCase() || '';
      
      if (cityLower.includes('konstanz') || districtLower.includes('konstanz')) {
        score += 1000;
      } else if (
        cityLower.match(/radolfzell|singen|stockach|engen|reichenau|allensbach|büsingen|gailingen|gottmadingen|hilzingen|moos|mühlhausen|öhningen|orsingen|rielasingen|steißlingen|tengen|volkertshausen/)
      ) {
        // Other municipalities in Landkreis Konstanz
        score += 500;
      }
      
      // Medium priority: Baden-Württemberg
      if (props.state === 'Baden-Württemberg') {
        score += 100;
      }
      
      // Bonus for places with names (POIs, businesses)
      if (props.name && props.name.length > 0) {
        score += 50;
      }
      
      // Bonus for complete addresses
      if (props.street && props.housenumber) {
        score += 10;
      }
      
      return { feature, score };
    });
    
    // Sort by score (highest first) and take results
    const sortedFeatures = scoredResults
      .sort((a, b) => b.score - a.score)
      .map(item => item.feature);
    
    // Filter to only German results if we have any
    const germanResults = sortedFeatures.filter(
      (feature) => feature.properties.countrycode === 'DE'
    );
    
    const results = germanResults.length > 0 ? germanResults : sortedFeatures;

    // Format and return results
    return results.map(formatPhotonAddress);
  } catch (error) {
    console.error('Photon API search error:', error);
    throw error;
  }
}

// Export only what's needed
export { PHOTON_API_URL, MIN_QUERY_LENGTH, DEBOUNCE_DELAY };
