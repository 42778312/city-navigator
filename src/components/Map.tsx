import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  pickup: [number, number] | null;
  destination: [number, number] | null;
  route: [number, number][] | null;
  onMapLoad?: (map: maplibregl.Map) => void;
}

const Map = ({ pickup, destination, route, onMapLoad }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupMarker = useRef<maplibregl.Marker | null>(null);
  const destinationMarker = useRef<maplibregl.Marker | null>(null);

  const createMarkerElement = (type: 'pickup' | 'destination') => {
    const el = document.createElement('div');
    el.className = 'relative';
    
    const isPickup = type === 'pickup';
    const bgColor = isPickup ? '#00D9FF' : '#22C55E';
    const icon = isPickup ? '📍' : '🎯';
    
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 rounded-full animate-ping" style="background: ${bgColor}30;"></div>
        <div class="absolute w-8 h-8 rounded-full" style="background: ${bgColor}50;"></div>
        <div class="relative w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg" 
             style="background: linear-gradient(135deg, ${bgColor}, ${isPickup ? '#0099CC' : '#16A34A'});">
          ${icon}
        </div>
      </div>
    `;
    
    return el;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
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
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [2.3522, 48.8566], // Paris
      zoom: 12,
      pitch: 0,
      bearing: 0,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      'bottom-right'
    );

    map.current.on('load', () => {
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onMapLoad]);

  // Update pickup marker
  useEffect(() => {
    if (!map.current) return;

    if (pickupMarker.current) {
      pickupMarker.current.remove();
      pickupMarker.current = null;
    }

    if (pickup) {
      pickupMarker.current = new maplibregl.Marker({
        element: createMarkerElement('pickup'),
        anchor: 'center',
      })
        .setLngLat(pickup)
        .addTo(map.current);
    }
  }, [pickup]);

  // Update destination marker
  useEffect(() => {
    if (!map.current) return;

    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }

    if (destination) {
      destinationMarker.current = new maplibregl.Marker({
        element: createMarkerElement('destination'),
        anchor: 'center',
      })
        .setLngLat(destination)
        .addTo(map.current);
    }
  }, [destination]);

  // Update route
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    const updateRoute = () => {
      // Remove existing route layer and source
      if (mapInstance.getLayer('route')) {
        mapInstance.removeLayer('route');
      }
      if (mapInstance.getLayer('route-outline')) {
        mapInstance.removeLayer('route-outline');
      }
      if (mapInstance.getSource('route')) {
        mapInstance.removeSource('route');
      }

      if (route && route.length > 0) {
        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route,
            },
          },
        });

        // Outline layer
        mapInstance.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#00D9FF',
            'line-width': 8,
            'line-opacity': 0.3,
          },
        });

        // Main route layer
        mapInstance.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#00D9FF',
            'line-width': 4,
            'line-opacity': 1,
          },
        });

        // Fit bounds to route
        const bounds = new maplibregl.LngLatBounds();
        route.forEach((coord) => bounds.extend(coord as [number, number]));
        mapInstance.fitBounds(bounds, {
          padding: { top: 100, bottom: 350, left: 50, right: 50 },
          duration: 1000,
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      updateRoute();
    } else {
      mapInstance.on('load', updateRoute);
    }
  }, [route]);

  // Fit bounds when both markers are set
  useEffect(() => {
    if (!map.current || !pickup || !destination || route) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend(pickup);
    bounds.extend(destination);
    
    map.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 350, left: 50, right: 50 },
      duration: 1000,
    });
  }, [pickup, destination, route]);

  return (
    <div ref={mapContainer} className="absolute inset-0" />
  );
};

export default Map;
