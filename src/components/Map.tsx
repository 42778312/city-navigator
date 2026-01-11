import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import PricePopup from './PricePopup';
import { PriceBreakdown } from '@/lib/taxiPricing';

interface RouteInfo {
  distance: number;
  duration: number;
  priceBreakdown: PriceBreakdown;
}

interface MapProps {
  pickup: [number, number] | null;
  destination: [number, number] | null;
  route: [number, number][] | null;
  onMapLoad?: (map: maplibregl.Map) => void;
  onMapClick?: () => void;
  routeInfo?: RouteInfo | null;
}

const Map = ({ pickup, destination, route, onMapLoad, onMapClick, routeInfo }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupMarker = useRef<maplibregl.Marker | null>(null);
  const destinationMarker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

  const createMarkerElement = (type: 'pickup' | 'destination') => {
    const el = document.createElement('div');
    // Ensure container is sized to contain the largest animation ring (48px)
    // and use flexbox to perfectly center content
    el.style.cssText = 'width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;';

    const isPickup = type === 'pickup';
    const bgColor = isPickup ? '#00D9FF' : '#22C55E';
    const icon = isPickup ? '📍' : '🎯';

    el.innerHTML = `
      <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: ${bgColor}30; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${bgColor}50;"></div>
      <div style="position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); background: linear-gradient(135deg, ${bgColor}, ${isPickup ? '#0099CC' : '#16A34A'}); color: white; border: 2px solid rgba(255,255,255,0.2);">
        ${icon}
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

  // Handle map clicks separately to avoid re-initializing the map
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = () => {
      if (onMapClick) {
        onMapClick();
      }
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [onMapClick]);

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

    if (popup.current) {
      popup.current.remove();
      popup.current = null;
    }

    if (destination) {
      destinationMarker.current = new maplibregl.Marker({
        element: createMarkerElement('destination'),
        anchor: 'center',
      })
        .setLngLat(destination)
        .addTo(map.current);

      // Add popup with price info if routeInfo is available
      if (routeInfo) {
        const popupContainer = document.createElement('div');
        const root = createRoot(popupContainer);
        root.render(
          <PricePopup
            priceBreakdown={routeInfo.priceBreakdown}
            distance={routeInfo.distance}
            duration={routeInfo.duration}
          />
        );

        popup.current = new maplibregl.Popup({
          offset: 40,
          closeButton: false,
          closeOnClick: false,
          className: 'price-popup-container',
          anchor: 'bottom',
        })
          .setLngLat(destination)
          .setDOMContent(popupContainer)
          .addTo(map.current);
      }
    }
  }, [destination, routeInfo]);

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
        // Ensure route starts at pickup and ends at destination
        let routeCoordinates = [...route];

        // Add pickup as first point if not already there
        if (pickup && (routeCoordinates[0][0] !== pickup[0] || routeCoordinates[0][1] !== pickup[1])) {
          routeCoordinates = [pickup, ...routeCoordinates];
        }

        // Add destination as last point if not already there
        if (destination && (routeCoordinates[routeCoordinates.length - 1][0] !== destination[0] ||
          routeCoordinates[routeCoordinates.length - 1][1] !== destination[1])) {
          routeCoordinates = [...routeCoordinates, destination];
        }

        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates,
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
  }, [route, pickup, destination]);

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
