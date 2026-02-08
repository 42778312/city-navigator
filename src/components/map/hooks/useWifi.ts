import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { createWifiMarkerElement } from '../utils/markers';
import { WIFI_SPOTS } from '@/lib/wifiApi';

interface UseWifiProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
}

export const useWifi = ({ map }: UseWifiProps) => {
    const wifiMarkers = useRef<maplibregl.Marker[]>([]);

    const addWifiMarkers = useCallback(() => {
        if (!map.current) return;
        const mapInstance = map.current;

        // Prevent duplicate markers if called multiple times?
        // Original code pushed to ref but didn't check for duplicates.
        // But it was called once in style.load.
        // Here we can clear first to be safe.
        wifiMarkers.current.forEach(m => m.remove());
        wifiMarkers.current = [];

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
    }, [map]);

    useEffect(() => {
        if (!map.current) return;

        // Add markers once map is loaded/ready
        // We can check if map is loaded or style loaded
        if (map.current.isStyleLoaded()) {
            addWifiMarkers();
        } else {
            map.current.once('load', addWifiMarkers);
            // map.on('load') vs map.on('style.load')?
            // Original used style.load for layers, BUT addWifiMarkers(); was also there.
        }

    }, [map, addWifiMarkers]);

    return { wifiMarkers };
};
