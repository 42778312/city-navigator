import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { MapRef } from '@/components/Map';
import RidePanel from '@/components/RidePanel';
import { TaxiStand } from '@/components/TaxiStand';
import Snowfall from '@/components/Snowfall';
import type { PriceBreakdown } from '@/lib/taxiPricing';
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useAuthState } from "@/features/auth";
import NavTabs from '@/components/nightlife/NavTabs';
import EventsPanel from '@/components/events/EventsPanel';
import { fetchEvents, PartyEvent } from '@/lib/partyApi';
import { searchAddress } from '@/lib/photonApi';

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

const LeadingLine: React.FC<{ mapRef: React.RefObject<MapRef>, event: PartyEvent, cardRect: DOMRect }> = ({ mapRef, event, cardRect }) => {
  const [targetPoint, setTargetPoint] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (event.venue?.coordinates) {
        const point = mapRef.current?.project(event.venue.coordinates);
        if (point) setTargetPoint(point);
      }
    };

    updatePosition();
    // In a production app, we'd add an event listener for map moves here.
  }, [event, mapRef, cardRect]);

  if (!targetPoint) return null;

  const startX = cardRect.left + cardRect.width / 2;
  const startY = cardRect.top;

  const midY = (startY + targetPoint.y) / 2;
  const path = `M ${startX} ${startY} C ${startX} ${midY}, ${targetPoint.x} ${midY}, ${targetPoint.x} ${targetPoint.y}`;

  return (
    <svg className="fixed inset-0 pointer-events-none z-50 overflow-visible">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.path
        d={path}
        stroke="#A78BFA"
        strokeWidth="2"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1], // Quintic easeOut
          opacity: { duration: 0.3 }
        }}
      />

      <motion.circle
        cx={targetPoint.x}
        cy={targetPoint.y}
        r="4"
        fill="#A78BFA"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
    </svg>
  );
};

const Index = ({ className = "w-full h-full", isDemo = false, lang = 'de' }: IndexProps) => {
  const { isSignedIn, signInWithGoogle } = useAuthState();
  const { openSignIn } = useClerk();
  const t = translations[lang];
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [isTaxiSearchOpen, setIsTaxiSearchOpen] = useState(true);
  const [routeInfo, setRouteInfo] = useState<PriceInfo | null>(null);
  const [isTaxiStandOpen, setIsTaxiStandOpen] = useState(false);
  const [nightlifeEnabled, setNightlifeEnabled] = useState(false);
  const [isNightlifeLoading, setIsNightlifeLoading] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [mapEvents, setMapEvents] = useState<PartyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<PartyEvent | null>(null);
  const [hoveredCardRect, setHoveredCardRect] = useState<DOMRect | null>(null);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const data = await fetchEvents({ per_page: 50 });
        const konstanzEvents = data.filter(event =>
          event.venue?.city?.toLowerCase() === 'konstanz' ||
          event.venue?.city?.toLowerCase() === 'constance'
        );

        const eventsWithCoords = await Promise.all(
          konstanzEvents.map(async (event) => {
            if (event.venue && !event.venue.coordinates) {
              try {
                const latLongAddress = event.venue.address ? `${event.venue.address}, Konstanz` : `${event.venue.venue}, Konstanz`;
                const searchResults = await searchAddress(latLongAddress, { limit: 1 });
                if (searchResults.length > 0) {
                  return {
                    ...event,
                    venue: {
                      ...event.venue,
                      coordinates: [searchResults[0].longitude, searchResults[0].latitude] as [number, number]
                    }
                  };
                }
              } catch (err) {
                console.warn(`Geocoding failed for ${event.venue.venue}: `, err);
              }
            }
            return event;
          })
        );

        setMapEvents(eventsWithCoords);
      } catch (err) {
        setEventsError('Fehler beim Laden der Events.');
        console.error(err);
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleNavTabToggle = (tabId: string) => {
    setActiveSections(prev => {
      const isActive = prev.includes(tabId);
      if (isActive) {
        // Toggle OFF
        if (tabId === 'nightlife') setNightlifeEnabled(false);
        return prev.filter(id => id !== tabId);
      } else {
        // Toggle ON
        let next = [...prev, tabId];
        if (tabId === 'nightlife') setNightlifeEnabled(true);
        if (tabId === 'taxi') {
          setIsTaxiSearchOpen(false);
          // Specific constraint: Taxi ON -> Events OFF
          next = next.filter(id => id !== 'events');
        }
        return next;
      }
    });
  };

  const handleMapInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  }, [hasInteracted]);

  const handleRouteCalculated = useCallback((routeGeometry: [number, number][] | null) => {
    setRoute(routeGeometry);
  }, []);

  const isTaxiActive = activeSections.includes('taxi');
  const isEventsActive = activeSections.includes('events');
  const isNightlifeActive = activeSections.includes('nightlife');

  return (
    <div className={`relative overflow-hidden bg-background ${className}`}>
      <Snowfall />

      <Map
        ref={mapRef}
        pickup={isTaxiActive ? (pickup?.coords || null) : null}
        destination={isTaxiActive ? (destination?.coords || null) : null}
        route={isTaxiActive ? route : null}
        onMapClick={() => {
          if (isTaxiActive) setIsTaxiSearchOpen(true);
        }}
        routeInfo={isTaxiActive ? routeInfo : null}
        onCallTaxi={() => isDemo ? setShowLoginHint(true) : setIsTaxiStandOpen(true)}
        nightlifeEnabled={nightlifeEnabled}
        onNightlifeLoading={setIsNightlifeLoading}
        isInteractive={!isDemo}
        onInteraction={handleMapInteraction}
        activeTab={activeSections.join(',')}
        viewMode={viewMode}
        events={isEventsActive ? mapEvents : []}
      />

      {/* Leading Line Overlay */}
      <AnimatePresence mode="wait">
        {hoveredEvent && hoveredCardRect && mapRef.current && (
          <LeadingLine
            key={hoveredEvent.id}
            mapRef={mapRef}
            event={hoveredEvent}
            cardRect={hoveredCardRect}
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 right-16 md:right-20 z-50">
        <button
          onClick={() => setViewMode(prev => prev === '2D' ? '3D' : '2D')}
          title={`Switch to ${viewMode === '3D' ? '2D' : '3D'} view`}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#1a1c23] hover:bg-[#252831] border border-white/10 shadow-xl transition-all hover:scale-105 active:scale-95 group"
        >
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-purple-400 transition-colors">
            VIEW
          </span>
          <span className="text-sm font-bold text-white leading-none mt-0.5">
            {viewMode === '3D' ? '2D' : '3D'}
          </span>
        </button>
      </div>

      {!isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-3"
        >
          <div className="glass-panel px-3 py-2 flex items-center justify-center">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t.signInGoogle}
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className={`${isTaxiActive ? 'block' : 'hidden'}`}>
        <RidePanel
          onPickupChange={setPickup}
          onDestinationChange={setDestination}
          onRouteCalculated={handleRouteCalculated}
          onRouteInfoChange={setRouteInfo}
          isMinimized={isTaxiSearchOpen}
          onToggleMinimize={() => setIsTaxiSearchOpen(!isTaxiSearchOpen)}
        />
      </div>

      <TaxiStand isOpen={isTaxiStandOpen} onOpenChange={setIsTaxiStandOpen} />

      <AnimatePresence>
        {isEventsActive && (
          <EventsPanel
            events={mapEvents}
            loading={eventsLoading}
            error={eventsError}
            onEventHover={(event, rect) => {
              if (window.matchMedia('(pointer: fine)').matches) {
                setHoveredEvent(event);
                setHoveredCardRect(rect);
              }
            }}
            onEventHoverEnd={() => {
              setHoveredEvent(null);
              setHoveredCardRect(null);
            }}
          />
        )}
      </AnimatePresence>

      <NavTabs
        activeTabs={activeSections}
        onChange={handleNavTabToggle}
      />

      {isDemo && showLoginHint && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#12141a] border border-white/10 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl"
          >
            <button
              onClick={() => setShowLoginHint(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close"
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
              onClick={() => openSignIn({ forceRedirectUrl: '/map' })}
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
