import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface UseMapInstanceProps {
    containerRef: React.RefObject<HTMLDivElement>;
    onMapClick?: () => void;
    onInteraction?: () => void;
}

export const useMapInstance = ({ containerRef, onMapClick, onInteraction }: UseMapInstanceProps) => {
    const map = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (containerRef.current && !map.current) {
            map.current = new maplibregl.Map({
                container: containerRef.current,
                style: 'https://tiles.openfreemap.org/styles/dark',
                center: [9.175820, 47.660330],
                zoom: 15.8,
                pitch: 62,
                bearing: -15,
                maxPitch: 85,
                maxBounds: [
                    [9.09, 47.63], // Southwest coordinates
                    [9.25, 47.73]  // Northeast coordinates
                ],
                minZoom: 12,
            });

            map.current.on('load', () => {
                setIsLoaded(true);
            });

            map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

            if (onMapClick) {
                map.current.on('click', onMapClick);
            }

            const triggerInteraction = () => onInteraction?.();
            map.current.on('mousedown', triggerInteraction);
            map.current.on('touchstart', triggerInteraction);
            map.current.on('wheel', triggerInteraction);
            map.current.on('moveend', triggerInteraction);
        }

        return () => {
            // Cleanup if needed, though usually map instance persists
        };
    }, [containerRef, onMapClick, onInteraction]);

    return { map, isLoaded };
};
