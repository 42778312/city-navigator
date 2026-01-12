# 🚀 Quick Start - Photon API Integration

## What Was Implemented

✅ **Production-ready address autocomplete** using OpenStreetMap data via Photon API  
✅ **German language support** - All results in German  
✅ **Landkreis Konstanz focus** - Restricted to Konstanz district  
✅ **Debounced search** - 300ms delay, minimum 3 characters  
✅ **Structured address data** - Street, house number, PLZ, city, coordinates  
✅ **Clean two-line display** - Formatted for optimal UX  

---

## Files Created/Modified

### ✨ New Files

1. **[src/lib/photonApi.ts](src/lib/photonApi.ts)**
   - Core Photon API service with full TypeScript types
   - `searchAddress()` - Main search function
   - `formatPhotonAddress()` - Formats API responses
   - `reverseGeocode()` - Get address from coordinates

2. **[PHOTON_API_GUIDE.md](PHOTON_API_GUIDE.md)**
   - Complete documentation and usage examples
   - API parameters and response formats
   - Production checklist

3. **[src/lib/photonApiExamples.ts](src/lib/photonApiExamples.ts)**
   - TypeScript code examples
   - Test suite for verification

4. **[public/photon-test.html](public/photon-test.html)**
   - Standalone test page (no build required)
   - Open in browser to test the API directly

### 🔧 Modified Files

1. **[src/components/SearchInput.tsx](src/components/SearchInput.tsx)**
   - Now uses Photon API instead of Nominatim
   - Displays addresses in two-line format
   - Returns `AddressResult` with coordinates

2. **[src/components/RidePanel.tsx](src/components/RidePanel.tsx)**
   - Updated to handle `AddressResult` interface
   - Extracts coordinates correctly

---

## How to Test

### Option 1: Test in Browser (Easiest)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open the test page in your browser:
   ```
   http://localhost:5173/photon-test.html
   ```

3. Try searching for:
   - `Brandenburger Tor Berlin`
   - `Hauptstraße 123 München`
   - `Kölner Dom`

### Option 2: Test in Your App

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open your app and try the search inputs for pickup/destination

3. Type at least 3 characters and wait 300ms for results

### Option 3: Run Code Tests

```typescript
// In browser console or Node.js
import { runTests } from './src/lib/photonApiExamples';
await runTests();
```

---

## API Usage

### Basic Search

```typescript
import { searchAddress } from '@/lib/photonApi';

const results = await searchAddress('Brandenburger Tor', {
  lang: 'de',
  limit: 10,
});

results.forEach(address => {
  console.log(address.displayLine1);  // "Münsterplatz"
  console.log(address.displayLine2);  // "78462 Konstanz, Deutschland"
  console.log(address.latitude);      // 47.6631
  console.log(address.longitude);     // 9.1758
});
```

### Address Result Structure

```typescript
interface AddressResult {
  // Display (for UI)
  displayLine1: string;     // "Hauptstraße 123"
  displayLine2: string;     // "10115 Berlin, Deutschland"
  fullAddress: string;      // Complete address
  
  // Components
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // Coordinates (for routing)
  latitude: number;
  longitude: number;
}
```

---

## Integration with Your App

The `SearchInput` component now automatically:

1. ✅ Waits for 3+ characters
2. ✅ Debounces input (300ms)
3. ✅ Searches Photon API in German
4. ✅ Restricts results to Landkreis Konstanz
5. ✅ Displays in two-line format
6. ✅ Returns coordinates with selection

**No additional changes needed** - it's already integrated!

---

## Example Queries to Try

| Query | Expected Result |
|-------|----------------|
| `Münsterplatz Konstanz` | Historic square in Konstanz |
| `Seestraße 21 Konstanz` | Street address with house number |
| `Radolfzell` | Town in Landkreis Konstanz |
| `Reichenau` | Island in Lake Constance |
| `Allensbach` | Municipality in the district |
| `Stockach` | Town in Landkreis Konstanz |

---

## API Request Details

Each search sends a request like this:

```
GET https://photon.komoot.io/api/
  ?q=Seestraße
  &lang=de
  &limit=10
  &lat=47.6779
  &lon=9.1732
  &bbox=8.65,47.55,9.35,47.85
```

**Parameters:**
- `q` - User's search query
- `lang=de` - German language
- `limit=10` - Max 10 results
- `lat/lon` - Konstanz center (bias)
- `bbox` - Landkreis Konstanz bounding box (restrict)

---

## Production Considerations

✅ **Free API** - No API key required  
✅ **Rate limiting** - Debouncing prevents excessive requests  
✅ **Error handling** - Graceful fallbacks on failures  
✅ **TypeScript** - Full type safety  
✅ **Caching** - Results can be cached (not implemented yet)  

### Potential Improvements

1. **Add caching** - Cache recent searches to reduce API calls
2. **Add favorites** - Save frequently used addresses
3. **User location** - Use GPS for better biasing
4. **Custom filters** - Filter by address type (streets only, POIs only, etc.)

---

## Support & Documentation

- 📖 **Full Guide**: [PHOTON_API_GUIDE.md](PHOTON_API_GUIDE.md)
- 💻 **Code Examples**: [src/lib/photonApiExamples.ts](src/lib/photonApiExamples.ts)
- 🧪 **Test Page**: [public/photon-test.html](public/photon-test.html)
- 🌐 **Photon API**: https://github.com/komoot/photon
- 🗺️ **OpenStreetMap**: https://www.openstreetmap.org/

---

## Troubleshooting

### No results appearing?

1. Make sure you typed at least 3 characters
2. Wait 300ms after typing
3. Check browser console for errors
4. Verify internet connection

### Wrong language?

The API is configured for German (`lang=de`). To change:

```typescript
await searchAddress(query, {
  lang: 'en',  // Change to English
  limit: 10,
});
```

### Results not in Germany?

Results are biased and bounded to Germany. If you need other countries:

```typescript
await searchAddress(query, {
  lang: 'de',
  // Remove bbox parameter or adjust coordinates
});
```

---

## Next Steps

1. ✅ Test the autocomplete in your app
2. ✅ Try the standalone test page
3. ✅ Review the documentation
4. Consider adding:
   - Recent searches history
   - Favorite locations
   - Custom filtering
   - Results caching

---

**Questions?** Check [PHOTON_API_GUIDE.md](PHOTON_API_GUIDE.md) for detailed documentation.
