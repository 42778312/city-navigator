import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface UseMapStyleProps {
    map: React.MutableRefObject<maplibregl.Map | null>;
    viewMode: '2D' | '3D';
}

export const useMapStyle = ({ map, viewMode }: UseMapStyleProps) => {

    useEffect(() => {
        if (!map.current) return;

        const setupLayers = () => {
            const m = map.current!;

            // 1. Hide default 2D buildings
            if (m.getLayer('building')) {
                m.setLayoutProperty('building', 'visibility', 'none');
            }

            // 2. Style street names (White & Prominent)
            if (m.getLayer('highway_name_other')) {
                m.setPaintProperty('highway_name_other', 'text-color', '#ffffff');
                m.setPaintProperty('highway_name_other', 'text-halo-color', 'rgba(0,0,0,0.8)');
                m.setPaintProperty('highway_name_other', 'text-halo-width', 2);
            }
            if (m.getLayer('highway_name_motorway')) {
                m.setPaintProperty('highway_name_motorway', 'text-color', '#ffffff');
                m.setPaintProperty('highway_name_motorway', 'text-halo-color', 'rgba(0,0,0,0.8)');
                m.setPaintProperty('highway_name_motorway', 'text-halo-width', 2);
            }

            // 3. Style place names (White)
            const placeLayers = ['place_city', 'place_town', 'place_village', 'place_suburb', 'place_other'];
            placeLayers.forEach(layer => {
                if (m.getLayer(layer)) {
                    m.setPaintProperty(layer, 'text-color', '#ffffff');
                    m.setPaintProperty(layer, 'text-halo-color', 'rgba(0,0,0,0.8)');
                    m.setPaintProperty(layer, 'text-halo-width', 2);
                }
            });

            // 4. Add 3D Buildings Layer
            if (!m.getLayer('3d-buildings')) {
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
            }

            // 5. Add Bus Stations Layer
            if (!m.getLayer('bus-stations')) {
                m.addLayer({
                    'id': 'bus-stations',
                    'type': 'symbol',
                    'source': 'openmaptiles',
                    'source-layer': 'poi',
                    'minzoom': 13,
                    'filter': [
                        'any',
                        ['==', ['get', 'class'], 'bus'],
                        ['==', ['get', 'subclass'], 'bus_stop'],
                        ['==', ['get', 'class'], 'railway'],
                        ['==', ['get', 'subclass'], 'bus_station']
                    ],
                    'layout': {
                        'text-field': ['get', 'name'],
                        'text-font': ['Noto Sans Regular'],
                        'text-size': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            13, 10,
                            18, 13
                        ],
                        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                        'text-radial-offset': 0.8,
                        'text-justify': 'auto',
                        'icon-image': [
                            'match',
                            ['get', 'class'],
                            'bus', 'bus',
                            'railway', 'railway',
                            'marker'
                        ],
                        'icon-size': 1,
                        'text-padding': 2
                    },
                    'paint': {
                        'text-color': '#ffffff',
                        'text-halo-color': 'rgba(0,0,0,0.8)',
                        'text-halo-width': 1.5
                    }
                });
            }

            // Initial view set
            m.setPitch(62);
            m.setBearing(-15);
        };

        if (map.current.isStyleLoaded()) {
            setupLayers();
        } else {
            map.current.on('style.load', setupLayers);
        }

        return () => {
            // Cleanup listeners if necessary
            map.current?.off('style.load', setupLayers);

        }

    }, [map]); // Run once when map is ready (effectively)

    // Handle View Mode Changes
    useEffect(() => {
        if (!map.current) return;
        const m = map.current;

        if (viewMode === '3D') {
            m.easeTo({
                pitch: 62,
                bearing: -15,
                duration: 1000
            });
            if (m.getLayer('3d-buildings')) {
                m.setLayoutProperty('3d-buildings', 'visibility', 'visible');
            }
        } else {
            m.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 1000
            });
            if (m.getLayer('3d-buildings')) {
                m.setLayoutProperty('3d-buildings', 'visibility', 'none');
            }
        }
    }, [viewMode, map]);
};
