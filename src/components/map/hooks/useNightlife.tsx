import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import NightlifePopup from '../../NightlifePopup';
import { createNightlifeMarkerElement } from '../utils/markers';
import { fetchNightlifeVenues, type NightlifeVenue } from '@/lib/nightlifeApi';

interface UseNightlifeProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
    nightlifeEnabled: boolean;
    onNightlifeLoading?: (loading: boolean) => void;
}

export const useNightlife = ({ map, nightlifeEnabled, onNightlifeLoading }: UseNightlifeProps) => {
    const nightlifeMarkers = useRef<maplibregl.Marker[]>([]);
    const [nightlifeVenues, setNightlifeVenues] = useState<NightlifeVenue[]>([]);
    const [venuesLoaded, setVenuesLoaded] = useState(false);

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
            const container = createNightlifeMarkerElement(venue);

            const popupNode = document.createElement('div');
            const root = createRoot(popupNode);
            root.render(<NightlifePopup venue={ venue } />);

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
    }, [nightlifeVenues, removeNightlifeLayers, map]);

    useEffect(() => {
        if (!map.current || !venuesLoaded || nightlifeVenues.length === 0) return;

        if (nightlifeEnabled) {
            addNightlifeLayers();
        } else {
            removeNightlifeLayers();
        }
    }, [nightlifeEnabled, nightlifeVenues, venuesLoaded, addNightlifeLayers, removeNightlifeLayers, map]);

    return { nightlifeMarkers, nightlifeVenues };
};
