import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import PricePopup from './PricePopup';
import type { PriceBreakdown } from '@/lib/taxiPricing';
import {
  fetchNightlifeVenues,
  isEveningTime,
  venuesToGeoJSON,
  getVenueStatusText,
  type NightlifeVenue
} from '@/lib/nightlifeApi';

interface RouteInfo {
  distance: number;
  duration: number;
  priceBreakdown: PriceBreakdown;
}

interface MapProps {
  pickup: [number, number] | null;
  destination: [number, number] | null;
  route: [number, number][] | null;
  onMapClick?: () => void;
  routeInfo?: RouteInfo | null;
  onCallTaxi: () => void;
  nightlifeEnabled?: boolean;
  onNightlifeLoading?: (loading: boolean) => void;
}

const Map = ({
  pickup,
  destination,
  route,
  onMapClick,
  routeInfo,
  onCallTaxi,
  nightlifeEnabled = false,
  onNightlifeLoading
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupMarker = useRef<maplibregl.Marker | null>(null);
  const destinationMarker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const [nightlifeVenues, setNightlifeVenues] = useState<NightlifeVenue[]>([]);
  const [venuesLoaded, setVenuesLoaded] = useState(false);

  const createMarkerElement = (type: 'pickup' | 'destination') => {
    const el = document.createElement('div');
    el.style.cssText = 'width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;';
    const isPickup = type === 'pickup';
    const bgColor = isPickup ? '#00D9FF' : '#22C55E';
    const icon = isPickup ? '📍' : '🎯';
    el.innerHTML = `
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${bgColor}30; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: ${bgColor}50;"></div>
      <div style="position: relative; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); background: linear-gradient(135deg, ${bgColor}, ${isPickup ? '#0099CC' : '#16A34A'}); color: white; border: 2px solid rgba(255,255,255,0.2);">
        ${icon}
      </div>
    `;
    return el;
  };

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      // Using ultra-dark minimal style
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'dark-tiles': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
              attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            },
          },
          layers: [{
            id: 'dark-background',
            type: 'raster',
            source: 'dark-tiles',
            minzoom: 0,
            maxzoom: 22,
          }],
        },
        center: [9.1732, 47.6779], // Konstanz, Germany
        zoom: 13,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      map.current.on('click', () => onMapClick && onMapClick());
    }
  }, [onMapClick]);

  // Load nightlife venues on first toggle
  const loadNightlifeVenues = useCallback(async () => {
    if (venuesLoaded || !nightlifeEnabled) return;

    try {
      onNightlifeLoading?.(true);
      const venues = await fetchNightlifeVenues();
      setNightlifeVenues(venues);
      setVenuesLoaded(true);
    } catch (error) {
      console.error('❌ Failed to load nightlife venues:', error);
    } finally {
      onNightlifeLoading?.(false);
    }
  }, [venuesLoaded, nightlifeEnabled, onNightlifeLoading]);

  // Trigger venue loading when nightlife is first enabled
  useEffect(() => {
    if (nightlifeEnabled && !venuesLoaded) {
      loadNightlifeVenues();
    }
  }, [nightlifeEnabled, venuesLoaded, loadNightlifeVenues]);

  // Add/remove nightlife visualization layers based on toggle
  useEffect(() => {
    console.log('🎨 Layer effect triggered - enabled:', nightlifeEnabled, 'loaded:', venuesLoaded, 'venues:', nightlifeVenues.length);
    if (!map.current || !venuesLoaded || nightlifeVenues.length === 0) return;

    const mapInstance = map.current;

    if (nightlifeEnabled) {
      console.log('➕ Adding nightlife layers...');
      addNightlifeLayers();
    } else {
      console.log('➖ Removing nightlife layers...');
      removeNightlifeLayers();
    }

    return () => {
      // Cleanup if needed
    };
  }, [nightlifeEnabled, nightlifeVenues, venuesLoaded]);

  // Add nightlife visualization layers
  const addNightlifeLayers = () => {
    if (!map.current) return;
    const mapInstance = map.current;

    const setupLayers = () => {
      // Convert venues to GeoJSON
      const geojson = venuesToGeoJSON(nightlifeVenues);

      // Add source
      if (!mapInstance.getSource('nightlife-venues')) {
        mapInstance.addSource('nightlife-venues', {
          type: 'geojson',
          data: geojson,
        });
      } else {
        // Update existing source
        const source = mapInstance.getSource('nightlife-venues') as maplibregl.GeoJSONSource;
        source.setData(geojson);
      }

      // Add heatmap layer with neon gradient (Snapchat-style)
      if (!mapInstance.getLayer('nightlife-heatmap')) {
        mapInstance.addLayer({
          id: 'nightlife-heatmap',
          type: 'heatmap',
          source: 'nightlife-venues',
          paint: {
            // Simplified weight for performance
            'heatmap-weight': 0.7,
            'heatmap-intensity': 1.0,
            // Simplified neon gradient
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(255, 107, 53, 0)',
              0.3, 'rgba(255, 107, 53, 0.4)',
              0.6, 'rgba(255, 46, 151, 0.6)',
              1, 'rgba(157, 78, 221, 0.9)',
            ],
            'heatmap-radius': 25,
            'heatmap-opacity': 0.5,
          },
        });
      }

      // Add nightclub glow layer (static for performance)
      if (!mapInstance.getLayer('nightclubs-glow')) {
        mapInstance.addLayer({
          id: 'nightclubs-glow',
          type: 'circle',
          source: 'nightlife-venues',
          filter: ['==', ['get', 'type'], 'nightclub'],
          paint: {
            'circle-radius': 25,
            'circle-color': '#ff2e97',
            'circle-blur': 1.2,
            'circle-opacity': 0.5,
          },
        });
      }

      // Add nightclub markers
      if (!mapInstance.getLayer('nightclubs')) {
        mapInstance.addLayer({
          id: 'nightclubs',
          type: 'circle',
          source: 'nightlife-venues',
          filter: ['==', ['get', 'type'], 'nightclub'],
          paint: {
            'circle-radius': 10,
            'circle-color': '#ff2e97',
            'circle-opacity': 1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9,
          },
        });
      }

      // Add bars/pubs glow layer (static for performance)
      if (!mapInstance.getLayer('bars-glow')) {
        mapInstance.addLayer({
          id: 'bars-glow',
          type: 'circle',
          source: 'nightlife-venues',
          filter: ['in', ['get', 'type'], ['literal', ['bar', 'pub']]],
          paint: {
            'circle-radius': 18,
            'circle-color': '#ff6b35',
            'circle-blur': 1.2,
            'circle-opacity': 0.4,
          },
        });
      }

      // Add bars/pubs markers
      if (!mapInstance.getLayer('bars-pubs')) {
        mapInstance.addLayer({
          id: 'bars-pubs',
          type: 'circle',
          source: 'nightlife-venues',
          filter: ['in', ['get', 'type'], ['literal', ['bar', 'pub']]],
          paint: {
            'circle-radius': 8,
            'circle-color': '#ff6b35',
            'circle-opacity': 1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.8,
          },
        });
      }

      // Add click handlers for venue popups
      ['nightclubs', 'bars-pubs'].forEach((layerId) => {
        mapInstance.on('click', layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coords = (feature.geometry as any).coordinates;
            const props = feature.properties;

            // Find the full venue data
            const venue = nightlifeVenues.find(v => v.id === props?.id);
            if (!venue) return;

            // Determine icon based on type
            const venueIcon = props?.type === 'nightclub' ? '🌙' : props?.type === 'pub' ? '🍺' : '🍸';
            const accentColor = props?.type === 'nightclub' ? '#ff2e97' : '#ff6b35';

            // Create stunning name-only popup
            new maplibregl.Popup({
              offset: 15,
              className: 'nightlife-popup',
              maxWidth: '260px',
              closeButton: false
            })
              .setLngLat(coords)
              .setHTML(`
                <div style="font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; padding: 0; position: relative;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, ${accentColor}25, ${accentColor}10); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; box-shadow: 0 4px 12px ${accentColor}20;">
                      ${venueIcon}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 17px; font-weight: 800; color: hsl(0 0% 98%); line-height: 1.3; letter-spacing: -0.02em; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);">
                        ${props?.name || 'Unnamed Venue'}
                      </div>
                    </div>
                  </div>
                  <div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background: ${accentColor}; box-shadow: 0 0 8px ${accentColor}, 0 0 16px ${accentColor}60; animation: pulse 2s ease-in-out infinite;"></div>
                </div>
              `)
              .addTo(mapInstance);
          }
        });

        // Change cursor on hover
        mapInstance.on('mouseenter', layerId, () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', layerId, () => {
          mapInstance.getCanvas().style.cursor = '';
        });
      });
    };

    if (mapInstance.isStyleLoaded()) {
      setupLayers();
    } else {
      mapInstance.once('load', setupLayers);
    }
  };

  // Remove nightlife layers
  const removeNightlifeLayers = () => {
    if (!map.current) return;
    const mapInstance = map.current;

    const layers = ['bars-pubs', 'bars-glow', 'nightclubs', 'nightclubs-glow', 'nightlife-heatmap'];

    layers.forEach(layerId => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.removeLayer(layerId);
      }
    });
  };


  useEffect(() => {
    if (map.current && pickup) {
      if (pickupMarker.current) pickupMarker.current.remove();
      pickupMarker.current = new maplibregl.Marker({ element: createMarkerElement('pickup'), anchor: 'center' })
        .setLngLat(pickup)
        .addTo(map.current);
    } else if (pickupMarker.current) {
      pickupMarker.current.remove();
      pickupMarker.current = null;
    }
  }, [pickup]);

  useEffect(() => {
    if (!map.current) return;

    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }
    if (popup.current) {
      popup.current.remove();
      popup.current = null;
    }

    if (destination) {
      destinationMarker.current = new maplibregl.Marker({ element: createMarkerElement('destination'), anchor: 'center' })
        .setLngLat(destination)
        .addTo(map.current);

      if (routeInfo) {
        const popupContainer = document.createElement('div');
        const root = createRoot(popupContainer);
        root.render(
          <PricePopup
            priceBreakdown={routeInfo.priceBreakdown}
            distance={routeInfo.distance}
            duration={routeInfo.duration}
            onCallTaxi={onCallTaxi}
          />
        );

        popup.current = new maplibregl.Popup({ offset: 30, closeButton: false, closeOnClick: false, className: 'price-popup-container', anchor: 'bottom' })
          .setLngLat(destination)
          .setDOMContent(popupContainer)
          .addTo(map.current);
      }
    } else if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }
  }, [destination, routeInfo, onCallTaxi]);

  useEffect(() => {
    if (!map.current) return;
    const mapInstance = map.current;

    const setupRoute = () => {
      // Remove existing route layers if they exist
      if (mapInstance.getSource('route')) {
        if (mapInstance.getLayer('route')) mapInstance.removeLayer('route');
        if (mapInstance.getLayer('route-outline')) mapInstance.removeLayer('route-outline');
        mapInstance.removeSource('route');
      }

      if (route && route.length > 0 && pickup && destination) {
        const routeCoordinates = [pickup, ...route, destination];

        // Add route source
        mapInstance.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoordinates } },
        });

        // Add route layers on top of everything (no beforeLayer parameter means they go on top)
        mapInstance.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#00D9FF', 'line-width': 8, 'line-opacity': 0.3 },
        });

        mapInstance.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#00D9FF', 'line-width': 4, 'line-opacity': 1 },
        });

        // Fit bounds to show the route
        const bounds = new maplibregl.LngLatBounds();
        routeCoordinates.forEach(coord => bounds.extend(coord as [number, number]));
        mapInstance.fitBounds(bounds, { padding: { top: 100, bottom: 150, left: 50, right: 50 }, duration: 1000 });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      setupRoute();
    } else {
      mapInstance.once('load', setupRoute);
    }
  }, [route, pickup, destination]);

  useEffect(() => {
    if (map.current && pickup && destination && !route) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(pickup);
      bounds.extend(destination);
      map.current.fitBounds(bounds, { padding: { top: 100, bottom: 350, left: 50, right: 50 }, duration: 1000 });
    }
  }, [pickup, destination, route]);

  return <div ref={mapContainer} className="absolute inset-0" />;
};

export default Map;
