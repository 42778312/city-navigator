import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import PricePopup from '../../PricePopup';
import { createMarkerElement, createUserLocationMarkerElement } from '../utils/markers';
import type { PriceBreakdown } from '@/lib/taxiPricing';

interface RouteInfo {
    distance: number;
    duration: number;
    priceBreakdown: PriceBreakdown;
}

interface UseMapMarkersProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
    pickup: [number, number] | null;
    destination: [number, number] | null;
    route: [number, number][] | null;
    routeInfo?: RouteInfo | null;
    userLocation?: [number, number] | null;
    onCallTaxi: () => void;
    isInteractive: boolean;
    viewMode: '2D' | '3D';
}

export const useMapMarkers = ({
    map,
    pickup,
    destination,
    route,
    routeInfo,
    userLocation,
    onCallTaxi,
    isInteractive,
    viewMode
}: UseMapMarkersProps) => {
    const pickupMarker = useRef<maplibregl.Marker | null>(null);
    const destinationMarker = useRef<maplibregl.Marker | null>(null);
    const userLocationMarker = useRef<maplibregl.Marker | null>(null);
    const pricePopup = useRef<maplibregl.Popup | null>(null);

    // 1. Handle Pickup Marker
    useEffect(() => {
        if (!map.current) return;

        if (pickup) {
            if (pickupMarker.current) pickupMarker.current.remove();
            pickupMarker.current = new maplibregl.Marker({ element: createMarkerElement('pickup'), anchor: 'center' })
                .setLngLat(pickup)
                .addTo(map.current);
        } else if (pickupMarker.current) {
            pickupMarker.current.remove();
            pickupMarker.current = null;
        }
    }, [pickup, map]);

    // 2. Handle Destination Marker & Price Popup
    useEffect(() => {
        if (!map.current) return;

        if (destinationMarker.current) destinationMarker.current.remove();
        if (pricePopup.current) pricePopup.current.remove();

        if (destination) {
            destinationMarker.current = new maplibregl.Marker({ element: createMarkerElement('destination'), anchor: 'center' })
                .setLngLat(destination)
                .addTo(map.current);

            if (routeInfo) {
                const popupContainer = document.createElement('div');
                const root = createRoot(popupContainer);
                root.render(<PricePopup priceBreakdown={ routeInfo.priceBreakdown } distance = { routeInfo.distance } duration = { routeInfo.duration } onCallTaxi = { onCallTaxi } disabled = {!isInteractive} />);

    pricePopup.current = new maplibregl.Popup({ offset: 30, closeButton: false, closeOnClick: false, anchor: 'bottom' })
        .setLngLat(destination)
        .setDOMContent(popupContainer)
        .addTo(map.current);
}
        }
    }, [destination, routeInfo, onCallTaxi, isInteractive, map]);

// 3. Handle User Location Marker
useEffect(() => {
    if (!map.current) return;

    if (userLocation) {
        if (userLocationMarker.current) {
            userLocationMarker.current.setLngLat(userLocation);
        } else {
            userLocationMarker.current = new maplibregl.Marker({
                element: createUserLocationMarkerElement(),
                anchor: 'center'
            })
                .setLngLat(userLocation)
                .addTo(map.current);
        }
        // Center map on user location if it's the first update or requested?
        // Original code centered map when userLocation received.
        map.current.flyTo({ center: userLocation, zoom: 16, duration: 2000 });

    } else if (userLocationMarker.current) {
        userLocationMarker.current.remove();
        userLocationMarker.current = null;
    }
}, [userLocation, map]);

// 4. Handle Route Drawing
useEffect(() => {
    if (!map.current) return;
    const mapInstance = map.current;

    const setupRoute = () => {
        // Cleanup old route
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

    if (mapInstance.isStyleLoaded()) {
        setupRoute();
    } else {
        mapInstance.once('load', setupRoute); // Wait for load if style not ready? Or style.load?
        // Original used: if (mapInstance.isStyleLoaded()) setupRoute(); else mapInstance.once('load', setupRoute);
    }

}, [route, pickup, destination, viewMode, map]);

// Return refs if needed by parent?
return { pickupMarker, destinationMarker, userLocationMarker };
};
