import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { createEventMarkerElement } from '../utils/markers';
import { PartyEvent } from '@/lib/partyApi';

interface UseEventsProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
    events: PartyEvent[];
    activeTab: string;
}

export const useEvents = ({ map, events, activeTab }: UseEventsProps) => {
    const eventMarkers = useRef<maplibregl.Marker[]>([]);

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

            const container = createEventMarkerElement(event);

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
    }, [events, removeEventMarkers, map]);

    useEffect(() => {
        if (!map.current) return;
        if (activeTab === 'events' && events.length > 0) {
            addEventMarkers();
        } else {
            removeEventMarkers();
        }
    }, [activeTab, events, addEventMarkers, removeEventMarkers, map]);

    return { eventMarkers };
};
