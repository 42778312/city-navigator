import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import { PartyEvent } from '@/lib/partyApi';
import EventCard from './EventCard';

interface EventsPanelProps {
    events: PartyEvent[];
    loading: boolean;
    error: string | null;
    onEventHover?: (event: PartyEvent, rect: DOMRect) => void;
    onEventHoverEnd?: () => void;
}

const EventsPanel: React.FC<EventsPanelProps> = ({ events, loading, error, onEventHover, onEventHoverEnd }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 z-[60] flex flex-col pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: 120 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 120 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="w-full pointer-events-auto bg-[#0a0b10]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
            >
                {/* Full Width Thumbnail Strip */}
                <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="p-2 md:p-3">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <div className="flex items-center justify-center py-10 w-full gap-3 text-white/40">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                    <span className="text-xs font-semibold uppercase tracking-widest">Preloading Konstanz Events...</span>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center py-10 w-full gap-4 text-white/40">
                                    <AlertCircle size={18} className="text-red-500" />
                                    <span className="text-xs font-semibold">{error}</span>
                                </div>
                            ) : (
                                <div className="flex flex-row gap-2 md:gap-3 px-1 md:px-2">
                                    {events.map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onMouseEnter={onEventHover}
                                            onMouseLeave={onEventHoverEnd}
                                        />
                                    ))}
                                    {/* Buffer for scrolling */}
                                    <div className="w-4 shrink-0" />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default EventsPanel;
