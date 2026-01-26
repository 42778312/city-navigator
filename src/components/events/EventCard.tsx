import React from 'react';
import { Calendar, MapPin, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PartyEvent } from '@/lib/partyApi';

interface EventCardProps {
    event: PartyEvent;
    onMouseEnter?: (event: PartyEvent, rect: DOMRect) => void;
    onMouseLeave?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onMouseEnter, onMouseLeave }) => {
    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (cardRef.current && onMouseEnter) {
            onMouseEnter(event, cardRef.current.getBoundingClientRect());
        }
    };

    const handleMouseLeave = () => {
        if (onMouseLeave) {
            onMouseLeave();
        }
    };

    const startDate = new Date(event.start_date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthIndex = parseInt(event.start_date_details.month) - 1;
    const shortMonth = months[monthIndex] || 'JAN';
    const day = event.start_date_details.day;

    // Format time to AM/PM for a premium international feel as seen in mockup
    const hour = parseInt(event.start_date_details.hour);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const formattedTime = `${displayHour}:${event.start_date_details.minutes} ${ampm}`;

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onMouseLeave}
            className="group relative overflow-hidden rounded-xl bg-[#1a1c23] border border-white/10 w-[160px] md:w-[200px] aspect-[4/3] flex-shrink-0 cursor-pointer shadow-lg"
        >
            {/* Image */}
            <div className="absolute inset-0">
                {event.image ? (
                    <img
                        src={event.image.url}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-purple-500/40" />
                    </div>
                )}
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </div>

            {/* Top Info Strip */}
            <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-10">
                <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex flex-col items-center min-w-[36px]">
                    <span className="text-[10px] font-black text-white leading-tight">{day}</span>
                    <span className="text-[8px] font-bold text-purple-400 leading-tight uppercase">{shortMonth}</span>
                </div>

                <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                    <span className="text-[9px] font-bold text-white whitespace-nowrap">{formattedTime}</span>
                </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3
                    className="text-[11px] md:text-[13px] font-bold text-white line-clamp-2 leading-tight drop-shadow-md"
                    dangerouslySetInnerHTML={{ __html: event.title }}
                />

                <div className="mt-1.5 flex items-center gap-1.5 opacity-80">
                    <MapPin className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                    <span className="text-[9px] md:text-[10px] text-white/80 font-medium truncate">
                        {event.venue?.venue || 'Konstanz'}
                    </span>
                </div>
            </div>

            {/* Featured Highlight */}
            {event.featured && (
                <div className="absolute top-1/2 right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
            )}
        </motion.div>
    );
};

export default EventCard;
