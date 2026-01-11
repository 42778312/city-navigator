import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Map from '@/components/Map';
import RidePanel from '@/components/RidePanel';

interface Location {
  address: string;
  coords: [number, number];
}

const Index = () => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);

  const handlePickupChange = useCallback((location: Location | null) => {
    setPickup(location);
  }, []);

  const handleDestinationChange = useCallback((location: Location | null) => {
    setDestination(location);
  }, []);

  const handleRouteCalculated = useCallback((routeGeometry: [number, number][] | null) => {
    setRoute(routeGeometry);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Map */}
      <Map
        pickup={pickup?.coords || null}
        destination={destination?.coords || null}
        route={route}
      />

      {/* Gradient overlay for better readability */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10"
      >
        <div className="glass-panel px-4 py-2.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-lg">🚕</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">RideFlow</span>
        </div>
      </motion.div>

      {/* Ride Panel */}
      <RidePanel
        onPickupChange={handlePickupChange}
        onDestinationChange={handleDestinationChange}
        onRouteCalculated={handleRouteCalculated}
      />
    </div>
  );
};

export default Index;
