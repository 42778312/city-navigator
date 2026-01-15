import React from 'react';
import { ExternalLink, Phone, MapPin, Star } from 'lucide-react';
import { NightlifeVenue, getVenueStatusText } from '@/lib/nightlifeApi';

interface NightlifePopupProps {
    venue: NightlifeVenue;
}

const NightlifePopup: React.FC<NightlifePopupProps> = ({ venue }) => {
    const statusText = getVenueStatusText(venue);
    const isOpen = venue.isOpen;
    const statusColor = isOpen ? 'text-green-500' : 'text-red-500';

    return (
        <div className="flex flex-col gap-4 p-1 min-w-[320px] max-w-[350px]">
            <div className="flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                    <img
                        src={venue.imageUrl}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center gap-1">
                    <h3 className="font-bold text-xl text-white leading-tight">
                        {venue.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-300">
                        <span className="flex items-center text-white font-medium">
                            <Star className="w-3.5 h-3.5 fill-current text-white mr-1" />
                            {venue.rating}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{venue.type === 'nightclub' ? 'Disco club' : venue.type}</span>
                    </div>
                    <div className={`text-sm font-medium ${statusColor}`}>
                        {statusText}
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 w-full">
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${venue.coordinates[1]},${venue.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium rounded-full transition-colors border border-gray-700"
                >
                    {/* <MapPin className="w-4 h-4" /> */}
                    Wegbeschreibung
                </a>

                {venue.website && (
                    <a
                        href={venue.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium rounded-full transition-colors border border-gray-700"
                    >
                        {/* <ExternalLink className="w-4 h-4" /> */}
                        Website
                    </a>
                )}

                <a
                    href={`tel:${venue.phone || ''}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium rounded-full transition-colors border border-gray-700"
                >
                    {/* <Phone className="w-4 h-4" /> */}
                    Anrufen
                </a>
            </div>
        </div>
    );
};

export default NightlifePopup;
