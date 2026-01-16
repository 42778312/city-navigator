import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import PricePopup from './PricePopup';
import NightlifePopup from './NightlifePopup';
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
  isInteractive?: boolean;
  onInteraction?: () => void;
  viewMode?: '2D' | '3D';
}

const Map = ({
  pickup,
  destination,
  route,
  onMapClick,
  routeInfo,
  onCallTaxi,
  nightlifeEnabled = false,
  onNightlifeLoading,
  isInteractive = true,
  onInteraction,
  viewMode = '3D'
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupMarker = useRef<maplibregl.Marker | null>(null);
  const destinationMarker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const nightlifeMarkers = useRef<maplibregl.Marker[]>([]);
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
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/dark',
        center: [9.1771, 47.6588], // Konstanz, Germany
        zoom: 15.8, // Zoomed out for city view
        pitch: 62, // 3D tilt
        bearing: -15, // Slight rotation
        maxPitch: 85,
      });

      map.current.on('style.load', () => {
        if (!map.current) return;
        const m = map.current;

        // Hide default flat buildings
        if (m.getLayer('building')) {
          m.setLayoutProperty('building', 'visibility', 'none');
        }

        // Add 3D buildings layer
        m.addLayer({
          'id': '3d-buildings',
          'source': 'openmaptiles',
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 13,
          'paint': {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              0, '#1f2937',   // Slate 800
              50, '#374151',  // Slate 700
              100, '#4b5563'  // Slate 600
            ],
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.8
          }
        });

        // Enforce initial view and rotation
        m.setPitch(62);
        m.setBearing(-15);
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      map.current.on('click', () => onMapClick && onMapClick());

      // Track user interaction
      const triggerInteraction = () => onInteraction?.();
      map.current.on('mousedown', triggerInteraction);
      map.current.on('touchstart', triggerInteraction);
      map.current.on('wheel', triggerInteraction);
      map.current.on('moveend', triggerInteraction);
    }
  }, [onMapClick, onInteraction]);

  // Handle 2D/3D toggle animation
  useEffect(() => {
    if (!map.current) return;

    if (viewMode === '3D') {
      map.current.easeTo({
        pitch: 62,
        bearing: -15,
        duration: 1000
      });
      // Show 3D buildings layer if it exists
      if (map.current.getLayer('3d-buildings')) {
        map.current.setLayoutProperty('3d-buildings', 'visibility', 'visible');
      }
    } else {
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
      // Hide 3D buildings layer if it exists
      if (map.current.getLayer('3d-buildings')) {
        map.current.setLayoutProperty('3d-buildings', 'visibility', 'none');
      }
    }
  }, [viewMode]);

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
    if (!map.current || !venuesLoaded || nightlifeVenues.length === 0) return;

    const mapInstance = map.current;

    if (nightlifeEnabled) {
      addNightlifeLayers();
    } else {
      removeNightlifeLayers();
    }

    return () => {
      // Cleanup if needed
    };
  }, [nightlifeEnabled, nightlifeVenues, venuesLoaded]);

  // Add nightlife markers
  const addNightlifeLayers = () => {
    if (!map.current) return;
    const mapInstance = map.current;

    // Clear existing markers first just in case
    removeNightlifeLayers();

    nightlifeVenues.forEach((venue) => {
      // Create marker container - this is what maplibre positions
      // We do NOT want transitions on this element's transform
      const container = document.createElement('div');
      container.className = 'nightlife-marker-container';
      container.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 0;
        height: 0;
        overflow: visible;
      `;

      // Create the styled pill element
      const pill = document.createElement('div');
      pill.className = 'nightlife-marker-pill';
      pill.style.cssText = `
        background-color: #0f1115;
        color: white;
        padding: 6px 10px;
        border-radius: 20px;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;
        z-index: 10;
        transform-origin: center center;
        white-space: nowrap;
      `;

      // Star icon + Rating
      pill.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        <span>${venue.rating.toFixed(1)}</span>
      `;

      // Hover state - animate the PILL, not the container
      pill.onmouseenter = () => {
        pill.style.transform = 'scale(1.15) translateY(-2px)';
        pill.style.backgroundColor = '#000000';
        pill.style.borderColor = 'white';
        pill.style.zIndex = '50';
      };

      pill.onmouseleave = () => {
        pill.style.transform = 'scale(1) translateY(0)';
        pill.style.backgroundColor = '#0f1115';
        pill.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        pill.style.zIndex = '10';
      };

      container.appendChild(pill);

      // Create Custom Popup
      const popupNode = document.createElement('div');
      const root = createRoot(popupNode);
      root.render(
        <NightlifePopup venue={venue} />
      );

      const markerPopup = new maplibregl.Popup({
        offset: 25, // adjusted for pill size
        closeButton: false,
        maxWidth: '350px',
        className: 'nightlife-popup-container'
      }).setDOMContent(popupNode);

      // Create Marker
      const marker = new maplibregl.Marker({
        element: container,
        anchor: 'center'
      })
        .setLngLat(venue.coordinates)
        .setPopup(markerPopup)
        .addTo(mapInstance);

      nightlifeMarkers.current.push(marker);
    });
  };

  // Remove nightlife markers
  const removeNightlifeLayers = () => {
    nightlifeMarkers.current.forEach(marker => marker.remove());
    nightlifeMarkers.current = [];
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
            disabled={!isInteractive}
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
        mapInstance.fitBounds(bounds, { padding: { top: 100, bottom: 150, left: 50, right: 50 }, duration: 1000, pitch: viewMode === '3D' ? 45 : 0 });
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
      map.current.fitBounds(bounds, { padding: { top: 100, bottom: 350, left: 50, right: 50 }, duration: 1000, pitch: viewMode === '3D' ? 45 : 0 });
    }
  }, [pickup, destination, route, viewMode]);

  return <div ref={mapContainer} className="absolute inset-0" />;
};

export default Map;
