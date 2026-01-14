import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Map from '@/components/Map';
import RidePanel from '@/components/RidePanel';
import NightlifeButton from '@/components/NightlifeButton';
import { TaxiStand } from '@/components/TaxiStand';
import type { PriceBreakdown } from '@/lib/taxiPricing';
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { useAuthState } from "@/features/auth";

interface PriceInfo {
  distance: number;
  duration: number;
  priceBreakdown: PriceBreakdown;
}

interface Location {
  address: string;
  coords: [number, number];
}

const Index = () => {
  const { isSignedIn, signInWithGoogle } = useAuthState();
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [isMinimized, setIsMinimized] = useState(true); // Hidden by default
  const [routeInfo, setRouteInfo] = useState<PriceInfo | null>(null);
  const [isTaxiStandOpen, setIsTaxiStandOpen] = useState(false);
  const [nightlifeEnabled, setNightlifeEnabled] = useState(false);
  const [isNightlifeLoading, setIsNightlifeLoading] = useState(false);

  const handleRouteCalculated = useCallback((routeGeometry: [number, number][] | null) => {
    setRoute(routeGeometry);
  }, []);

  const handleNightlifeToggle = useCallback((enabled: boolean) => {
    setNightlifeEnabled(enabled);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <Map
        pickup={pickup?.coords || null}
        destination={destination?.coords || null}
        route={route}
        onMapClick={() => setIsMinimized(true)}
        routeInfo={routeInfo}
        onCallTaxi={() => setIsTaxiStandOpen(true)}
        nightlifeEnabled={nightlifeEnabled}
        onNightlifeLoading={setIsNightlifeLoading}
      />

      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-3"
      >
        {/* Auth Section */}
        <div className="glass-panel px-3 py-2 flex items-center justify-center">
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </motion.div>

      {/* Nightlife Button */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
        <NightlifeButton
          onToggle={handleNightlifeToggle}
          isLoading={isNightlifeLoading}
        />
      </div>

      <RidePanel
        onPickupChange={setPickup}
        onDestinationChange={setDestination}
        onRouteCalculated={handleRouteCalculated}
        onRouteInfoChange={setRouteInfo}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
      />

      <TaxiStand isOpen={isTaxiStandOpen} onOpenChange={setIsTaxiStandOpen} />
    </div>
  );
};

export default Index;
