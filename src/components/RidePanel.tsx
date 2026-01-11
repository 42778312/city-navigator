import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Car, Sparkles } from 'lucide-react';
import SearchInput from './SearchInput';
import PriceCard from './PriceCard';

interface Location {
  address: string;
  coords: [number, number];
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: [number, number][];
}

interface RidePanelProps {
  onPickupChange: (location: Location | null) => void;
  onDestinationChange: (location: Location | null) => void;
  onRouteCalculated: (route: [number, number][] | null) => void;
}

const RidePanel = ({ onPickupChange, onDestinationChange, onRouteCalculated }: RidePanelProps) => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [price, setPrice] = useState<number | null>(null);

  const handlePickupSelect = (result: { display_name: string; lat: string; lon: string }) => {
    const coords: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
    setPickupAddress(result.display_name);
    setPickupCoords(coords);
    onPickupChange({ address: result.display_name, coords });
    // Reset route when changing locations
    setRouteInfo(null);
    setPrice(null);
    onRouteCalculated(null);
  };

  const handleDestinationSelect = (result: { display_name: string; lat: string; lon: string }) => {
    const coords: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
    setDestinationAddress(result.display_name);
    setDestinationCoords(coords);
    onDestinationChange({ address: result.display_name, coords });
    // Reset route when changing locations
    setRouteInfo(null);
    setPrice(null);
    onRouteCalculated(null);
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

        setRouteInfo({
          distance: distanceKm,
          duration: durationMin,
          geometry,
        });

        // Calculate price: base fare + per km
        const baseFare = 3;
        const pricePerKm = 1.8;
        const calculatedPrice = baseFare + (distanceKm * pricePerKm);
        setPrice(calculatedPrice);

        onRouteCalculated(geometry);
      }
    } catch (error) {
      console.error('Routing error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const canCalculate = pickupCoords && destinationCoords && !isCalculating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10"
    >
      <div className="max-w-lg mx-auto space-y-4">
        {/* Search Panel */}
        <motion.div
          className="glass-panel p-4 md:p-5"
          layout
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">Book a Ride</h2>
              <p className="text-xs text-muted-foreground">Enter your pickup and destination</p>
            </div>
          </div>

          {/* Search inputs */}
          <div className="space-y-3">
            <SearchInput
              type="pickup"
              value={pickupAddress}
              onChange={(value) => {
                setPickupAddress(value);
                if (!value) {
                  setPickupCoords(null);
                  onPickupChange(null);
                }
              }}
              onSelect={handlePickupSelect}
              placeholder="Enter pickup location"
            />
            
            {/* Connector line */}
            <div className="flex items-center gap-3 px-4">
              <div className="w-[2px] h-6 bg-gradient-to-b from-primary to-success rounded-full ml-[13px]" />
            </div>

            <SearchInput
              type="destination"
              value={destinationAddress}
              onChange={(value) => {
                setDestinationAddress(value);
                if (!value) {
                  setDestinationCoords(null);
                  onDestinationChange(null);
                }
              }}
              onSelect={handleDestinationSelect}
              placeholder="Enter destination"
            />
          </div>

          {/* Calculate button */}
          <motion.button
            onClick={calculateRoute}
            disabled={!canCalculate}
            className={`w-full mt-4 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              canCalculate
                ? 'glow-button text-primary-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            whileTap={canCalculate ? { scale: 0.98 } : undefined}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating route...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Calculate Ride
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Price Card */}
        <AnimatePresence>
          {routeInfo && price !== null && (
            <PriceCard
              distance={routeInfo.distance}
              duration={routeInfo.duration}
              price={price}
              isVisible={true}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RidePanel;
