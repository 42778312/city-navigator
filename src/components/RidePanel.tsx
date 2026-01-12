import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Car, Sparkles } from 'lucide-react';
import SearchInput from './SearchInput';
import { calculateTaxiFare, type PriceBreakdown } from '@/lib/taxiPricing';
import type { AddressResult } from '@/lib/photonApi';

interface Location {
  address: string;
  coords: [number, number];
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: [number, number][];
}

interface PriceInfo {
  distance: number;
  duration: number;
  priceBreakdown: PriceBreakdown;
}

interface RidePanelProps {
  onPickupChange: (location: Location | null) => void;
  onDestinationChange: (location: Location | null) => void;
  onRouteCalculated: (route: [number, number][] | null) => void;
  onRouteInfoChange: (routeInfo: PriceInfo | null) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const RidePanel = ({
  onPickupChange,
  onDestinationChange,
  onRouteCalculated,
  onRouteInfoChange,
  isMinimized = false,
  onToggleMinimize
}: RidePanelProps) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleSelect = (type: 'pickup' | 'destination', result: AddressResult) => {
    const coords: [number, number] = [result.longitude, result.latitude];
    const location = { address: result.fullAddress, coords };

    if (type === 'pickup') {
      setPickupAddress(result.displayLine1);
      setPickupCoords(coords);
      onPickupChange(location);
    } else {
      setDestinationAddress(result.displayLine1);
      setDestinationCoords(coords);
      onDestinationChange(location);
    }

    onRouteCalculated(null);
    onRouteInfoChange(null);
  };

  const calculateRoute = async () => {
    if (!pickupCoords || !destinationCoords) return;

    setIsCalculating(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupCoords[0]},${pickupCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = route.distance / 1000;
        const durationMin = route.duration / 60;
        const geometry = route.geometry.coordinates as [number, number][];

        const breakdown = calculateTaxiFare(distanceKm);
        
        onRouteCalculated(geometry);
        onRouteInfoChange({ distance: distanceKm, duration: durationMin, priceBreakdown: breakdown });

        if (onToggleMinimize) onToggleMinimize();
      }
    } catch (error) {
      console.error('Routing error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const canCalculate = pickupCoords && destinationCoords && !isCalculating;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10 pointer-events-none">
      <div className="max-w-lg mx-auto relative">
        <AnimatePresence mode="wait">
          {!isMinimized ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="space-y-4 pointer-events-auto"
            >
              <motion.div className="glass-panel p-4 md:p-5" layout>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-semibold text-foreground">Book a Ride</h2>
                    <p className="text-xs text-muted-foreground">Enter your pickup and destination</p>
                  </div>
                  {onToggleMinimize && (
                    <button onClick={onToggleMinimize} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground" title="Minimize">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <SearchInput type="pickup" value={pickupAddress} onChange={setPickupAddress} onSelect={(result) => handleSelect('pickup', result)} placeholder="Enter pickup location" />
                  <div className="flex items-center gap-3 px-4">
                    <div className="w-[2px] h-6 bg-gradient-to-b from-primary to-success rounded-full ml-[13px]" />
                  </div>
                  <SearchInput type="destination" value={destinationAddress} onChange={setDestinationAddress} onSelect={(result) => handleSelect('destination', result)} placeholder="Enter destination" />
                </div>

                <motion.button
                  onClick={calculateRoute}
                  disabled={!canCalculate}
                  className={`w-full mt-4 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${canCalculate ? 'glow-button text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  whileTap={canCalculate ? { scale: 0.98 } : undefined}
                >
                  {isCalculating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Calculating route...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Calculate Ride<ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="minimized"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="space-y-4 pointer-events-auto"
            >
              <div className="flex justify-center">
                <button onClick={onToggleMinimize} className="glass-panel px-6 py-3 flex items-center gap-3 hover:bg-white/10 transition-all group scale-button">
                  <div className="p-1.5 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors"><Car className="w-4 h-4 text-primary" /></div>
                  <span className="font-semibold text-sm text-foreground">Restore Ride Panel</span>
                  <ArrowRight className="w-4 h-4 -rotate-90 text-primary" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RidePanel;
