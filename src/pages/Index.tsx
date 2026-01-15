import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Map from '@/components/Map';
import RidePanel from '@/components/RidePanel';
import NightlifeButton from '@/components/NightlifeButton';
import { TaxiStand } from '@/components/TaxiStand';
import Snowfall from '@/components/Snowfall';
import type { PriceBreakdown } from '@/lib/taxiPricing';
import { UserButton } from "@clerk/clerk-react";
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

interface IndexProps {
  className?: string;
  isDemo?: boolean;
  lang?: 'de' | 'en';
}

const translations = {
  de: {
    hintTitle: "Erlebnis erweitern?",
    hintDescription: "Melden Sie sich an, um alle Funktionen zu nutzen und das volle Erlebnis zu genießen!",
    hintButton: "Anmelden",
    signInGoogle: "Mit Google anmelden"
  },
  en: {
    hintTitle: "Expand Experience?",
    hintDescription: "Sign in to use all features and enjoy the full experience!",
    hintButton: "Sign In",
    signInGoogle: "Sign in with Google"
  }
};

const Index = ({ className = "w-full h-full", isDemo = false, lang = 'de' }: IndexProps) => {
  const { isSignedIn, signInWithGoogle } = useAuthState();
  const t = translations[lang];
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [isMinimized, setIsMinimized] = useState(true); // Hidden by default
  const [routeInfo, setRouteInfo] = useState<PriceInfo | null>(null);
  const [isTaxiStandOpen, setIsTaxiStandOpen] = useState(false);
  const [nightlifeEnabled, setNightlifeEnabled] = useState(isDemo);
  const [isNightlifeLoading, setIsNightlifeLoading] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (isDemo && hasInteracted && !showLoginHint) {
      const timer = setTimeout(() => {
        setShowLoginHint(true);
      }, 60000); // 60 seconds

      return () => clearTimeout(timer);
    }
  }, [isDemo, hasInteracted, showLoginHint]);

  const handleMapInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  const handleRouteCalculated = useCallback((routeGeometry: [number, number][] | null) => {
    setRoute(routeGeometry);
  }, []);

  const handleNightlifeToggle = useCallback((enabled: boolean) => {
    setNightlifeEnabled(enabled);
  }, []);

  return (
    <div className={`relative overflow-hidden bg-background ${className}`}>
      <Snowfall />
      <Map
        pickup={pickup?.coords || null}
        destination={destination?.coords || null}
        route={route}
        onMapClick={() => setIsMinimized(true)}
        routeInfo={routeInfo}
        onCallTaxi={() => setIsTaxiStandOpen(true)}
        nightlifeEnabled={nightlifeEnabled}
        onNightlifeLoading={setIsNightlifeLoading}
        isInteractive={!isDemo}
        onInteraction={handleMapInteraction}
      />


      {!isDemo && (
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
                {t.signInGoogle}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {!isDemo && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <NightlifeButton
            onToggle={handleNightlifeToggle}
            isLoading={isNightlifeLoading}
          />
        </div>
      )}

      <RidePanel
        onPickupChange={setPickup}
        onDestinationChange={setDestination}
        onRouteCalculated={handleRouteCalculated}
        onRouteInfoChange={setRouteInfo}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
      />

      <TaxiStand isOpen={isTaxiStandOpen} onOpenChange={setIsTaxiStandOpen} />

      {isDemo && showLoginHint && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#12141a] border border-white/10 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl"
          >
            <button
              onClick={() => setShowLoginHint(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t.hintTitle}</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              {t.hintDescription}
            </p>
            <button
              onClick={() => signInWithGoogle('/map')}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20"
            >
              {t.hintButton}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Index;
