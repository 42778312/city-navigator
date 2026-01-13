# Nightlife Feature - Snapchat-Style Visualization

## Overview

A production-ready nightlife mapping feature for Konstanz, Germany, with Snapchat-inspired neon visualizations, real-time opening hours, and interactive venue discovery.

## Features Implemented

### 1. **Data Source - OpenStreetMap via Overpass API**
- Fetches real nightlife venue data from OpenStreetMap
- Queries the city boundary of Konstanz, Germany
- Includes three venue types:
  - 🍸 **Bars** - Casual drinking establishments
  - 🍺 **Pubs** - Traditional public houses
  - 🌙 **Nightclubs** - Dance and late-night venues
- Supports nodes, ways, and relations
- Converts Overpass JSON to GeoJSON for MapLibre

### 2. **Snapchat-Style Visualization**

#### Heatmap Layer
- **Neon gradient**: Orange → Pink → Purple
- Intensity-based weighting:
  - Nightclubs: Highest intensity (3x)
  - Pubs: Medium intensity (1.5x)
  - Bars: Base intensity (1x)
- Time-aware amplification (1.5x during evening hours: 6 PM - 6 AM)
- Dynamic opacity based on zoom level

#### Glowing Markers
- **Nightclubs**: Strong pink glow (#ff2e97) with pulsing animation
- **Bars/Pubs**: Softer orange glow (#ff6b35)
- Blur and opacity effects create aura
- Stroke borders for definition

### 3. **Interactive UI**

#### Floating Toggle Button
- Top-right corner placement
- Animated gradient background when active
- Loading state with spinner
- Rotating moon icon animation
- Pulsing glow ring effect
- Smooth spring animations

#### Venue Popups
- Click any venue to see details:
  - Venue name
  - Type with emoji (Bar 🍸, Pub 🍺, Nightclub 🌙)
  - Real-time opening status
  - Opening/closing times
  - Raw opening hours string
- Custom styled with pink/purple gradient
- Enhanced shadow and blur effects

### 4. **Opening Hours Intelligence**

#### Real-Time Status
- Uses `opening_hours.js` library
- Parses complex OSM opening hours syntax
- Shows current state:
  - 🟢 **Open** - "Open until HH:mm"
  - 🔴 **Closed** - "Closed • Opens at HH:mm"
  - ⚪ **Unknown** - "Hours unknown"
- Automatic status updates every 5 minutes

#### Visual Feedback
- Closed venues are faded (30% opacity)
- Open venues maintain full brightness
- Glow effects reduced for closed venues
- Time-aware calculations

### 5. **Code Architecture**

```
src/
├── components/
│   ├── Map.tsx                 # Main map component with nightlife layers
│   └── NightlifeButton.tsx     # Floating toggle button
├── lib/
│   └── nightlifeApi.ts         # Overpass API integration & parsing
└── pages/
    └── Index.tsx               # App integration
```

#### Key Modules

**`nightlifeApi.ts`**
- `fetchNightlifeVenues()` - Fetch from Overpass API
- `venuesToGeoJSON()` - Convert to MapLibre format
- `parseOpeningHours()` - opening_hours.js integration
- `getVenueStatusText()` - Format display strings
- `isEveningTime()` - Time-aware detection

**`Map.tsx`**
- Single map instance (reused)
- Lazy loading (only fetches on first toggle)
- Layer management (add/remove on toggle)
- Animation loop for pulsing effects
- 5-minute status update interval
- Proper cleanup on unmount

**`NightlifeButton.tsx`**
- Spring-based animations
- Loading states
- Gradient backgrounds
- Framer Motion effects

## Technical Specifications

### MapLibre Layers

1. **nightlife-heatmap** (heatmap)
   - Weight by venue intensity
   - 6-stop color gradient
   - Zoom-dependent radius (15px → 50px)

2. **nightclubs-glow** (circle)
   - Radius: 8px → 30px
   - Full blur for aura effect
   - Animated opacity (0.3 → 0.7)

3. **nightclubs** (circle)
   - Radius: 5px → 18px
   - Pink fill with white stroke
   - Open/closed opacity

4. **bars-glow** (circle)
   - Radius: 6px → 22px
   - Orange glow
   - Reduced intensity vs nightclubs

5. **bars-pubs** (circle)
   - Radius: 4px → 14px
   - Orange fill with white stroke
   - Open/closed opacity

### Overpass Query

```overpass
[out:json][timeout:25];
area["name"="Konstanz"]["place"="city"]->.searchArea;
(
  node["amenity"="bar"](area.searchArea);
  node["amenity"="pub"](area.searchArea);
  node["amenity"="nightclub"](area.searchArea);
  way["amenity"="bar"](area.searchArea);
  way["amenity"="pub"](area.searchArea);
  way["amenity"="nightclub"](area.searchArea);
  relation["amenity"="bar"](area.searchArea);
  relation["amenity"="pub"](area.searchArea);
  relation["amenity"="nightclub"](area.searchArea);
);
out center tags;
```

## Usage

### Toggle Nightlife View

```tsx
<NightlifeButton 
  onToggle={(enabled) => setNightlifeEnabled(enabled)}
  isLoading={isLoading}
/>
```

### Map Integration

```tsx
<Map
  nightlifeEnabled={nightlifeEnabled}
  onNightlifeLoading={setIsNightlifeLoading}
  // ... other props
/>
```

## Dependencies

- **maplibre-gl** (^5.15.0) - Map rendering
- **opening_hours** (latest) - Opening hours parsing
- **framer-motion** (^12.25.0) - Animations
- **TypeScript** - Type safety

## Performance Optimizations

1. **Lazy Loading** - Venues only fetched on first toggle
2. **Single Map Instance** - No re-initialization
3. **Efficient Layer Toggle** - Add/remove without re-fetch
4. **RequestAnimationFrame** - Smooth animations
5. **Debounced Updates** - 5-minute status refresh interval
6. **Zoom-Based Detail** - Progressive rendering

## Browser Requirements

- Modern browsers (Chrome, Firefox, Safari, Edge)
- WebGL support (for MapLibre)
- Geolocation API (optional, for current location)
- HTTPS or localhost (for GPS features)

## Known Limitations

1. **Opening Hours Parsing**
   - Complex rules may fail gracefully
   - Defaults to "open" on parse errors
   - German locale assumed

2. **Data Coverage**
   - Limited to OSM data quality in Konstanz
   - Some venues may lack opening hours
   - Data as recent as OSM updates

3. **API Rate Limiting**
   - Overpass API has rate limits
   - Caching implemented (single fetch per session)

## Future Enhancements

- [ ] User contributions for missing hours
- [ ] Crowd-sourced "currently busy" indicators
- [ ] Filter by venue type
- [ ] Search within nightlife venues
- [ ] Save favorite venues
- [ ] Social features (check-ins, reviews)
- [ ] Multi-city support
- [ ] Progressive Web App offline support

## Testing

```bash
npm run dev
# Navigate to http://localhost:8081
# Click "Show Nightlife" button in top-right
# Wait for venues to load
# Click venues to see details
# Toggle on/off to test visibility
```

## Production Considerations

1. **Overpass API**
   - Consider hosting own instance
   - Implement proper caching
   - Handle rate limits gracefully

2. **Opening Hours**
   - Validate complex patterns
   - Test edge cases (24/7, seasonal)
   - Handle timezone changes

3. **Performance**
   - Monitor animation performance
   - Optimize for mobile devices
   - Consider reducing venues for low-end devices

4. **Accessibility**
   - Add keyboard navigation
   - Screen reader support
   - High contrast mode

## License

Part of the RideFlow city navigator project.
