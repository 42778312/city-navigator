import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { useMapInstance } from './map/hooks/useMapInstance';
import { useMapStyle } from './map/hooks/useMapStyle';
import { useMapMarkers } from './map/hooks/useMapMarkers';
import { useNightlife } from './map/hooks/useNightlife';
import { useEvents } from './map/hooks/useEvents';
import { useWifi } from './map/hooks/useWifi';
import type { PriceBreakdown } from '@/lib/taxiPricing';
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
  userLocation?: [number, number] | null;
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
  events = [],
  userLocation = null
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  // 1. Initialize Map
  const { map } = useMapInstance({
    containerRef: mapContainer,
    onMapClick,
    onInteraction
  });

  // 2. Manage Map Style & Layers
  useMapStyle({
    map,
    viewMode
  });

  // 3. Manage Markers & Route (Pickup, Dest, User, Route)
  useMapMarkers({
    map,
    pickup,
    destination,
    route,
    routeInfo,
    userLocation,
    onCallTaxi,
    isInteractive,
    viewMode
  });

  // 4. Manage Nightlife Venues
  useNightlife({
    map,
    nightlifeEnabled,
    onNightlifeLoading
  });

  // 5. Manage Events
  useEvents({
    map,
    events,
    activeTab
  });

  // 6. Manage Wifi Spots
  useWifi({
    map
  });

  // Expose project method
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

  return <div ref={mapContainer} className="absolute inset-0" />;
});

Map.displayName = 'Map';

export default Map;
