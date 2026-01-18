import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Car, Sparkles, Navigation, ArrowUpDown } from 'lucide-react';
import SearchInput from './SearchInput';
import { calculateTaxiFare, type PriceBreakdown } from '@/lib/taxiPricing';
import { reverseGeocode, type AddressResult } from '@/lib/photonApi';
import { useToast } from '@/hooks/use-toast';

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
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const { toast } = useToast();

  const handleUseCurrentLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        title: "GPS nicht verfügbar",
        description: "Ihr Browser unterstützt keine Standortdienste.",
        variant: "destructive"
      });
      return;
    }

    // Check if we're on a secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      toast({
        title: "HTTPS erforderlich",
        description: "GPS-Funktion benötigt eine sichere Verbindung (HTTPS).",
        variant: "destructive"
      });
      return;
    }

    // Check permissions API if available
    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        console.log('Geolocation permission status:', permissionStatus.state);

        if (permissionStatus.state === 'denied') {
          toast({
            title: "Standortzugriff blockiert",
            description: "Bitte erlauben Sie den Standortzugriff in Ihren Browsereinstellungen.",
            variant: "destructive"
          });
          return;
        }
      } catch (e) {
        console.warn('Permission API not supported:', e);
      }
    }

    setIsLoadingGPS(true);
    console.log('Requesting geolocation...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Geolocation success:', position.coords);
        try {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get address
          const address = await reverseGeocode(latitude, longitude);

          if (address) {
            const coords: [number, number] = [address.longitude, address.latitude];
            const location = { address: address.fullAddress, coords };

            setPickupAddress(address.displayLine1);
            setPickupCoords(coords);
            onPickupChange(location);

            toast({
              title: "Standort gefunden",
              description: address.displayLine1
            });
          } else {
            toast({
              title: "Adresse nicht gefunden",
              description: "Bitte geben Sie die Adresse manuell ein.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast({
            title: "Fehler",
            description: "Adresse konnte nicht ermittelt werden.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingGPS(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error.code, error.message);
        setIsLoadingGPS(false);
        let title = "GPS Fehler";
        let message = "Standort konnte nicht ermittelt werden.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            title = "Zugriff verweigert";
            message = "Bitte erlauben Sie den Standortzugriff in Ihren Browsereinstellungen und laden Sie die Seite neu.";
            break;
          case error.POSITION_UNAVAILABLE:
            title = "Position nicht verfügbar";
            message = "Ihr Gerät konnte den Standort nicht ermitteln. Stellen Sie sicher, dass GPS/Standortdienste aktiviert sind oder nutzen Sie ein Gerät mit GPS-Unterstützung.";
            break;
          case error.TIMEOUT:
            title = "Zeitüberschreitung";
            message = "Standortabfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.";
            break;
        }

        toast({
          title: title,
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  };

  const handlePickupAddressChange = (value: string) => {
    setPickupAddress(value);
    // Clear route when pickup field is cleared
    if (!value) {
      setPickupCoords(null);
      onPickupChange(null);
      onRouteCalculated(null);
      onRouteInfoChange(null);
    }
  };

  const handleDestinationAddressChange = (value: string) => {
    setDestinationAddress(value);
    // Clear route when destination field is cleared
    if (!value) {
      setDestinationCoords(null);
      onDestinationChange(null);
      onRouteCalculated(null);
      onRouteInfoChange(null);
    }
  };

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

  const handleSwapLocations = () => {
    // Swap addresses
    const tempAddress = pickupAddress;
    setPickupAddress(destinationAddress);
    setDestinationAddress(tempAddress);

    // Swap coordinates
    const tempCoords = pickupCoords;
    setPickupCoords(destinationCoords);
    setDestinationCoords(tempCoords);

    // Swap in parent state
    const tempLocation = pickupCoords ? { address: pickupAddress, coords: pickupCoords } : null;
    const destLocation = destinationCoords ? { address: destinationAddress, coords: destinationCoords } : null;

    onPickupChange(destLocation);
    onDestinationChange(tempLocation);

    // Clear route
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
              <motion.div className="glass-panel p-3 md:p-4" layout>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-semibold text-sm text-foreground">Book a Ride</h2>
                    <p className="text-[10px] text-muted-foreground">Enter your pickup and destination</p>
                  </div>
                  {onToggleMinimize && (
                    <button onClick={onToggleMinimize} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground" title="Minimize">
                      <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <SearchInput type="pickup" value={pickupAddress} onChange={handlePickupAddressChange} onSelect={(result) => handleSelect('pickup', result)} placeholder="Enter pickup location" />
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={isLoadingGPS}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors text-primary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                      title="Aktuellen Standort verwenden"
                    >
                      {isLoadingGPS ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-3">
                    <div className="w-[2px] h-4 bg-gradient-to-b from-primary to-success rounded-full ml-[11px]" />
                    <motion.button
                      onClick={handleSwapLocations}
                      disabled={!pickupAddress && !destinationAddress}
                      className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9, rotate: 180 }}
                      title="Adressen tauschen"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <SearchInput type="destination" value={destinationAddress} onChange={handleDestinationAddressChange} onSelect={(result) => handleSelect('destination', result)} placeholder="Enter destination" />
                </div>

                <motion.button
                  onClick={calculateRoute}
                  disabled={!canCalculate}
                  className={`w-full mt-3 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${canCalculate ? 'glow-button text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  whileTap={canCalculate ? { scale: 0.98 } : undefined}
                >
                  {isCalculating ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Calculating...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" />Calculate Ride<ArrowRight className="w-3.5 h-3.5" /></>
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
                  <span className="font-semibold text-sm text-foreground">call a Taxi</span>
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
