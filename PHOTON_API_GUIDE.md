# Photon API Integration - Address Autocomplete

## Overview

This implementation provides production-ready address autocomplete functionality using OpenStreetMap data via the Photon API. All addresses are returned in German with results biased towards Germany.

## Features

✅ **Photon API Integration** - Uses `https://photon.komoot.io/api/`  
✅ **German Language** - All results in German (`lang=de`)  
✅ **Landkreis Konstanz Focus** - Results restricted to Konstanz district  
✅ **Debounced Search** - 300ms delay to reduce API calls  
✅ **Minimum Characters** - Requires 3+ characters before querying  
✅ **Structured Data** - Returns parsed address components + coordinates  
✅ **Production Ready** - Full error handling and TypeScript typing

## File Structure

```
src/
├── lib/
│   └── photonApi.ts          # Core Photon API service
├── components/
│   ├── SearchInput.tsx       # Updated autocomplete component
│   └── RidePanel.tsx         # Updated to use AddressResult
```

## API Service (`photonApi.ts`)

### Main Functions

#### 1. `searchAddress(query, options)`

Search for addresses based on user input.

```typescript
import { searchAddress } from '@/lib/photonApi';

const results = await searchAddress('Hauptstraße', {
  lang: 'de',      // Language (German)
  limit: 10,       // Max results
});

// Returns: AddressResult[]
```

#### 2. `formatPhotonAddress(feature)`

Converts raw Photon API response into structured format.

```typescript
const formatted = formatPhotonAddress(photonFeature);

console.log(formatted.displayLine1);  // "Hauptstraße 123"
console.log(formatted.displayLine2);  // "10115 Berlin, Deutschland"
console.log(formatted.latitude);      // 52.5200
console.log(formatted.longitude);     // 13.4050
```

#### 3. `reverseGeocode(latitude, longitude)`

Get address from coordinates (optional feature).

```typescript
const address = await reverseGeocode(52.5200, 13.4050);
console.log(address?.fullAddress);  // "Hauptstraße 123, 10115 Berlin, Deutschland"
```

## Data Types

### AddressResult Interface

```typescript
interface AddressResult {
  // Display formatting (optimized for UI)
  displayLine1: string;     // "Hauptstraße 123"
  displayLine2: string;     // "10115 Berlin, Deutschland"
  fullAddress: string;      // Full formatted address
  
  // Structured components
  street?: string;          // "Hauptstraße"
  houseNumber?: string;     // "123"
  postalCode?: string;      // "10115"
  city?: string;            // "Berlin"
  district?: string;        // District/suburb
  state?: string;           // "Berlin"
  country?: string;         // "Deutschland"
  
  // Coordinates (REQUIRED for routing)
  latitude: number;         // 52.5200
  longitude: number;        // 13.4050
  
  // Original Photon data
  raw: PhotonFeature;
}
```

## Usage Example

### Basic Search

```typescript
import { searchAddress } from '@/lib/photonApi';

async function handleSearch(userInput: string) {
  try {
    const results = await searchAddress(userInput, {
      lang: 'de',
      limit: 8,
    });
    
    results.forEach(address => {
      console.log(`📍 ${address.displayLine1}`);
      console.log(`   ${address.displayLine2}`);
      console.log(`   Coords: ${address.latitude}, ${address.longitude}`);
    });
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Example usage
await handleSearch('Brandenburger Tor');
```

### With Custom Location Bias

```typescript
// Bias results towards a specific location (e.g., user's current position)
const results = await searchAddress('Marktplatz', {
  lang: 'de',
  limit: 10,
  lat: 50.1109,    // Frankfurt
  lon: 8.6821,
});
```

## Component Integration

### SearchInput Component

The `SearchInput` component has been updated to:

1. Use Photon API instead of Nominatim
2. Display addresses in two-line format
3. Pass structured `AddressResult` to parent components

```typescript
<SearchInput
  type="pickup"
  value={pickupAddress}
  onChange={setPickupAddress}
  onSelect={(result: AddressResult) => {
    // result.displayLine1: "Hauptstraße 123"
    // result.displayLine2: "10115 Berlin, Deutschland"
    // result.latitude: 52.5200
    // result.longitude: 13.4050
    handlePickupSelected(result);
  }}
  placeholder="Abhol­adresse eingeben"
/>
```

### UI Display

Addresses are displayed in a clean two-line format:

```
📍 Hauptstraße 123
   10115 Berlin, Deutschland

📍 Alexanderplatz
   10178 Berlin, Deutschland

📍 Brandenburger Tor
   10117 Berlin, Deutschland
```

## API Request Parameters

### Query Parameters Sent to Photon API

```
GET https://photon.komoot.io/api/?q=Hauptstraße&lang=de&limit=10&lat=51.1657&lon=10.4515&bbox=5.98,47.30,15.02,55.00
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `q` | User input | Search query |
| `lang` | `de` | German language |
| `limit` | `8-10` | Max results |
| `lat` | `51.1657` | Germany center (bias) |
| `lon` | `10.4515` | Germany center (bias) |
| `bbox` | `5.98,47.30,15.02,55.00` | Germany bounding box |

## Response Filtering

The implementation automatically:

1. **Prioritizes German addresses** - Filters by `countrycode === 'DE'`
2. **Falls back gracefully** - Shows all results if no German addresses found
3. **Validates minimum length** - Only searches with 3+ characters

## Performance Optimizations

1. **Debouncing** - 300ms delay prevents excessive API calls
2. **Smart filtering** - Prioritizes German results client-side
3. **Efficient rendering** - Uses React.memo and proper key management
4. **Cancellation** - Previous requests are cancelled when new ones start

## Error Handling

```typescript
try {
  const results = await searchAddress(query);
  // Handle results
} catch (error) {
  // Photon API errors are caught and logged
  console.error('Search error:', error);
  // Component automatically shows empty results
}
```

## Production Checklist

- ✅ TypeScript types for all API responses
- ✅ Error handling for network failures
- ✅ Debounced input to reduce API load
- ✅ Minimum character validation (3+)
- ✅ Germany-specific filtering
- ✅ German language support
- ✅ Coordinates returned for routing
- ✅ Structured address components
- ✅ Clean two-line display format
- ✅ Accessible keyboard navigation
- ✅ Loading states and animations

## Testing

### Test Queries

```typescript
// Should work well
await searchAddress('Brandenburger Tor');
await searchAddress('Hauptstraße 123 Berlin');
await searchAddress('München Marienplatz');
await searchAddress('Kölner Dom');

// Edge cases
await searchAddress('Ab');  // Too short - returns []
await searchAddress('XYZ123NonExistent');  // Returns []
```

### Expected Results Format

```json
{
  "displayLine1": "Hauptstraße 123",
  "displayLine2": "10115 Berlin, Deutschland",
  "fullAddress": "Hauptstraße 123, 10115 Berlin, Deutschland",
  "street": "Hauptstraße",
  "houseNumber": "123",
  "postalCode": "10115",
  "city": "Berlin",
  "state": "Berlin",
  "country": "Deutschland",
  "latitude": 52.5200,
  "longitude": 13.4050
}
```

## Advanced Features

### Custom Bounding Box

```typescript
// Restrict to specific region (e.g., Bavaria)
const results = await searchAddress('Marktplatz', {
  lang: 'de',
  bbox: '8.9,47.2,13.9,50.6', // Bavaria bounds
});
```

### OSM Tag Filtering

```typescript
// Filter by specific place types
const results = await searchAddress('Krankenhaus', {
  lang: 'de',
  osm_tag: 'amenity:hospital',
});
```

## Migration Notes

### Changes from Nominatim

**Before (Nominatim):**
```typescript
interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}
```

**After (Photon):**
```typescript
interface AddressResult {
  displayLine1: string;     // NEW: Formatted street
  displayLine2: string;     // NEW: Formatted location
  latitude: number;         // Changed from string
  longitude: number;        // Changed from string
  street?: string;          // NEW: Component
  postalCode?: string;      // NEW: Component
  // ... more structured data
}
```

## API Limits & Rate Limiting

The Photon API is free and open, but please:

- ✅ Implement debouncing (done: 300ms)
- ✅ Set reasonable limits (done: 8-10 results)
- ✅ Cache results when possible
- ❌ Don't send requests for every keystroke
- ❌ Don't make parallel duplicate requests

## Support & Resources

- **Photon API Docs**: https://github.com/komoot/photon
- **OpenStreetMap**: https://www.openstreetmap.org/
- **API Endpoint**: https://photon.komoot.io/api/

## License

This implementation uses the free Photon API which accesses OpenStreetMap data. Both are available under open licenses (OSM: ODbL, Photon: Apache 2.0).
