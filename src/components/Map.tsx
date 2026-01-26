import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import PricePopup from './PricePopup';
import NightlifePopup from './NightlifePopup';
import type { PriceBreakdown } from '@/lib/taxiPricing';
import {
  fetchNightlifeVenues,
  venuesToGeoJSON,
  getVenueStatusText,
  type NightlifeVenue
} from '@/lib/nightlifeApi';
import { WIFI_SPOTS } from '@/lib/wifiApi';
import { PartyEvent } from '@/lib/partyApi';

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
  activeTab?: string;
  events?: PartyEvent[];
}

export interface MapRef {
  project: (lngLat: [number, number]) => { x: number; y: number } | null;
}

const Map = forwardRef<MapRef, MapProps>(({
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
  viewMode = '3D',
  activeTab = '',
  events = []
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupMarker = useRef<maplibregl.Marker | null>(null);
  const destinationMarker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const nightlifeMarkers = useRef<maplibregl.Marker[]>([]);
  const wifiMarkers = useRef<maplibregl.Marker[]>([]);
  const eventMarkers = useRef<maplibregl.Marker[]>([]);
  const [nightlifeVenues, setNightlifeVenues] = useState<NightlifeVenue[]>([]);
  const [venuesLoaded, setVenuesLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    project: (lngLat: [number, number]) => {
      if (!map.current) return null;
      try {
        const point = map.current.project(lngLat);
        return { x: point.x, y: point.y };
      } catch (e) {
        return null;
      }
    }
  }));

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

  const createWifiMarkerElement = () => {
    const el = document.createElement('div');
    el.style.cssText = 'width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    el.innerHTML = `
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #00D9FF20; border: 1px solid #00D9FF40; backdrop-blur: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s ease;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
      </div>
    `;

    el.onmouseenter = () => {
      const child = el.firstElementChild as HTMLElement;
      if (child) {
        child.style.transform = 'scale(1.2)';
        child.style.backgroundColor = '#00D9FF40';
        child.style.borderColor = '#00D9FF';
      }
    };

    el.onmouseleave = () => {
      const child = el.firstElementChild as HTMLElement;
      if (child) {
        child.style.transform = 'scale(1)';
        child.style.backgroundColor = '#00D9FF20';
        child.style.borderColor = '#00D9FF40';
      }
    };

    return el;
  };

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/dark',
        center: [9.1771, 47.6588],
        zoom: 15.8,
        pitch: 62,
        bearing: -15,
        maxPitch: 85,
      });

      map.current.on('style.load', () => {
        if (!map.current) return;
        const m = map.current;

        if (m.getLayer('building')) {
          m.setLayoutProperty('building', 'visibility', 'none');
        }

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
              0, '#1f2937',
              50, '#374151',
              100, '#4b5563'
            ],
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.8
          }
        });

        m.setPitch(62);
        m.setBearing(-15);
        addWifiMarkers();
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
      map.current.on('click', () => onMapClick && onMapClick());

      const triggerInteraction = () => onInteraction?.();
      map.current.on('mousedown', triggerInteraction);
      map.current.on('touchstart', triggerInteraction);
      map.current.on('wheel', triggerInteraction);
      map.current.on('moveend', triggerInteraction);
    }
  }, [onMapClick, onInteraction]);

  useEffect(() => {
    if (!map.current) return;

    if (viewMode === '3D') {
      map.current.easeTo({
        pitch: 62,
        bearing: -15,
        duration: 1000
      });
      if (map.current.getLayer('3d-buildings')) {
        map.current.setLayoutProperty('3d-buildings', 'visibility', 'visible');
      }
    } else {
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
      if (map.current.getLayer('3d-buildings')) {
        map.current.setLayoutProperty('3d-buildings', 'visibility', 'none');
      }
    }
  }, [viewMode]);

  const loadNightlifeVenuesCallback = useCallback(async () => {
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

  useEffect(() => {
    if (nightlifeEnabled && !venuesLoaded) {
      loadNightlifeVenuesCallback();
    }
  }, [nightlifeEnabled, venuesLoaded, loadNightlifeVenuesCallback]);

  const removeNightlifeLayers = useCallback(() => {
    nightlifeMarkers.current.forEach(marker => marker.remove());
    nightlifeMarkers.current = [];
  }, []);

  const addNightlifeLayers = useCallback(() => {
    if (!map.current) return;
    const mapInstance = map.current;
    removeNightlifeLayers();

    nightlifeVenues.forEach((venue) => {
      const container = document.createElement('div');
      container.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 0; height: 0; overflow: visible;';

      const pill = document.createElement('div');
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;
        z-index: 10;
        transform-origin: center center;
        white-space: nowrap;
      `;

      pill.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        <span>${venue.rating.toFixed(1)}</span>
      `;

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

      const popupNode = document.createElement('div');
      const root = createRoot(popupNode);
      root.render(<NightlifePopup venue={venue} />);

      const markerPopup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: '350px',
      }).setDOMContent(popupNode);

      const marker = new maplibregl.Marker({ element: container, anchor: 'center' })
        .setLngLat(venue.coordinates)
        .setPopup(markerPopup)
        .addTo(mapInstance);

      nightlifeMarkers.current.push(marker);
    });
  }, [nightlifeVenues, removeNightlifeLayers]);

  useEffect(() => {
    if (!map.current || !venuesLoaded || nightlifeVenues.length === 0) return;
    const mapInstance = map.current;

    if (nightlifeEnabled) {
      addNightlifeLayers();
    } else {
      removeNightlifeLayers();
    }
  }, [nightlifeEnabled, nightlifeVenues, venuesLoaded, viewMode, addNightlifeLayers, removeNightlifeLayers]);

  const removeEventMarkers = useCallback(() => {
    eventMarkers.current.forEach(marker => marker.remove());
    eventMarkers.current = [];
  }, []);

  const addEventMarkers = useCallback(() => {
    if (!map.current) return;
    const mapInstance = map.current;
    removeEventMarkers();

    events.forEach((event) => {
      if (!event.venue || !event.venue.coordinates) return;

      const container = document.createElement('div');
      container.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 0; height: 0; overflow: visible;';

      const pill = document.createElement('div');
      pill.style.cssText = `
        background-color: #1a1c23;
        color: white;
        padding: 4px 10px 4px 4px;
        border-radius: 20px;
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        cursor: pointer;
        border: 1px solid rgba(124, 58, 237, 0.4);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 20;
        transform-origin: center center;
        white-space: nowrap;
      `;

      const imageUrl = event.image?.url || 'https://images.unsplash.com/photo-1514525253361-bee8d40d04a6?w=100&q=80';
      pill.innerHTML = `
        <div style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(167, 139, 250, 0.5);">
          <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <span style="color: #A78BFA; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px;">EVENT</span>
      `;

      pill.onmouseenter = () => {
        pill.style.transform = 'scale(1.1) translateY(-2px)';
        pill.style.backgroundColor = '#252831';
        pill.style.borderColor = '#7C3AED';
        pill.style.zIndex = '60';
      };

      pill.onmouseleave = () => {
        pill.style.transform = 'scale(1) translateY(0)';
        pill.style.backgroundColor = '#1a1c23';
        pill.style.borderColor = 'rgba(124, 58, 237, 0.4)';
        pill.style.zIndex = '20';
      };

      container.appendChild(pill);

      const popupHTML = `
        <div style="padding: 0; background: #12141a; border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 24px; overflow: hidden; color: white; min-width: 300px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          <div style="position: relative; aspect-ratio: 16/9; width: 100%; overflow: hidden;">
            <img src="${event.image?.url || 'https://images.unsplash.com/photo-1514525253361-bee8d40d04a6?w=600&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" />
            ${event.featured ? `<div style="position: absolute; top: 12px; left: 12px; padding: 4px 8px; border-radius: 8px; background: rgba(124, 58, 237, 0.8); backdrop-filter: blur(8px); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Featured</div>` : ''}
          </div>
          <div style="padding: 20px;">
            <div style="margin-bottom: 4px;"><span style="color: #A78BFA; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">${event.categories[0]?.name || 'Party'}</span></div>
            <div style="font-weight: 800; font-size: 18px; line-height: 1.25; margin-bottom: 12px; color: white;">${event.title}</div>
            <div style="display: flex; flex-direction: column; gap: 8px; color: rgba(255,255,255,0.6); font-size: 13px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>${event.start_date_details.day}.${event.start_date_details.month}.${event.start_date_details.year} | ${event.start_date_details.hour}:${event.start_date_details.minutes}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span style="font-weight: 600;">${event.venue.venue}</span>
              </div>
            </div>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 800; color: #A78BFA; font-size: 16px;">${event.cost || 'Entry TBA'}</span>
            </div>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false, maxWidth: '320px' }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({ element: container, anchor: 'center' })
        .setLngLat(event.venue.coordinates)
        .setPopup(popup)
        .addTo(mapInstance);

      eventMarkers.current.push(marker);
    });
  }, [events, removeEventMarkers]);

  useEffect(() => {
    if (!map.current) return;
    if (activeTab === 'events' && events.length > 0) {
      addEventMarkers();
    } else {
      removeEventMarkers();
    }
  }, [activeTab, events, addEventMarkers, removeEventMarkers]);

  const addWifiMarkers = useCallback(() => {
    if (!map.current) return;
    const mapInstance = map.current;

    WIFI_SPOTS.forEach((spot) => {
      const el = createWifiMarkerElement();
      const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
        <div style="padding: 12px; background: rgba(13, 14, 18, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; backdrop-blur: 12px; color: white;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="width: 24px; height: 24px; border-radius: 6px; background: rgba(0, 217, 255, 0.1); display: flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
            </div>
            <span style="font-weight: 700; font-size: 14px;">Free WiFi</span>
          </div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500;">${spot.name}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 4px;">Provider: ${spot.source}</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(spot.coordinates)
        .setPopup(popup)
        .addTo(mapInstance);

      wifiMarkers.current.push(marker);
    });
  }, []);

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
    if (destinationMarker.current) destinationMarker.current.remove();
    if (popup.current) popup.current.remove();

    if (destination) {
      destinationMarker.current = new maplibregl.Marker({ element: createMarkerElement('destination'), anchor: 'center' })
        .setLngLat(destination)
        .addTo(map.current);

      if (routeInfo) {
        const popupContainer = document.createElement('div');
        const root = createRoot(popupContainer);
        root.render(<PricePopup priceBreakdown={routeInfo.priceBreakdown} distance={routeInfo.distance} duration={routeInfo.duration} onCallTaxi={onCallTaxi} disabled={!isInteractive} />);
        popup.current = new maplibregl.Popup({ offset: 30, closeButton: false, closeOnClick: false, anchor: 'bottom' })
          .setLngLat(destination)
          .setDOMContent(popupContainer)
          .addTo(map.current);
      }
    }
  }, [destination, routeInfo, onCallTaxi, isInteractive]);

  useEffect(() => {
    if (!map.current) return;
    const mapInstance = map.current;

    const setupRoute = () => {
      if (mapInstance.getSource('route')) {
        if (mapInstance.getLayer('route')) mapInstance.removeLayer('route');
        if (mapInstance.getLayer('route-outline')) mapInstance.removeLayer('route-outline');
        mapInstance.removeSource('route');
      }

      if (route && route.length > 0 && pickup && destination) {
        const routeCoordinates = [pickup, ...route, destination];
        mapInstance.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoordinates } } });
        mapInstance.addLayer({ id: 'route-outline', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#00D9FF', 'line-width': 8, 'line-opacity': 0.3 } });
        mapInstance.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#00D9FF', 'line-width': 4, 'line-opacity': 1 } });
        const bounds = new maplibregl.LngLatBounds();
        routeCoordinates.forEach(coord => bounds.extend(coord as [number, number]));
        mapInstance.fitBounds(bounds, { padding: { top: 100, bottom: 150, left: 50, right: 50 }, duration: 1000, pitch: viewMode === '3D' ? 45 : 0 });
      }
    };

    if (mapInstance.isStyleLoaded()) setupRoute();
    else mapInstance.once('load', setupRoute);
  }, [route, pickup, destination, viewMode]);

  useEffect(() => {
    if (!map.current) return;
    if (activeTab !== 'taxi' && !nightlifeEnabled && activeTab !== '') {
      map.current.easeTo({ center: [9.1771, 47.6588], zoom: 15.8, pitch: viewMode === '3D' ? 62 : 0, bearing: viewMode === '3D' ? -15 : 0, duration: 2000 });
    }
  }, [activeTab, nightlifeEnabled, viewMode]);

  return <div ref={mapContainer} className="absolute inset-0" />;
});

Map.displayName = 'Map';

export default Map;
