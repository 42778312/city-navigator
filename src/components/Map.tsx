import { useEffect, useRef } from 'react';
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
  onMapClick?: () => void;
  routeInfo?: RouteInfo | null;
  onCallTaxi: () => void;
}

const Map = ({ pickup, destination, route, onMapClick, routeInfo, onCallTaxi }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupMarker = useRef<maplibregl.Marker | null>(null);
  const destinationMarker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

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
          layers: [{
            id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 22,
          }],
        },
        center: [9.177, 47.663], // Konstanz
        zoom: 13,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      map.current.on('click', () => onMapClick && onMapClick());
    }
  }, [onMapClick]);

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
      if (mapInstance.getSource('route')) {
        mapInstance.removeLayer('route-outline');
        mapInstance.removeLayer('route');
        mapInstance.removeSource('route');
      }

      if (route && route.length > 0 && pickup && destination) {
        const routeCoordinates = [pickup, ...route, destination];
        mapInstance.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoordinates } },
        });
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
