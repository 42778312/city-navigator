import React from 'react';
import { Phone, Navigation, Clock, Euro } from 'lucide-react';
import type { PriceBreakdown } from '@/lib/taxiPricing';
import { formatPrice } from '@/lib/taxiPricing';

interface PricePopupProps {
    priceBreakdown: PriceBreakdown;
    distance: number;
    duration: number;
    onCallTaxi: () => void;
    disabled?: boolean;
}

const PricePopup: React.FC<PricePopupProps> = ({
    priceBreakdown,
    distance,
    duration,
    onCallTaxi,
    disabled = false,
}) => {
    return (
        <div className="price-popup flex flex-col gap-3 min-w-[200px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <div className="text-xl">{priceBreakdown.tariffIcon}</div>
                    <div>
                        <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider leading-none">
                            {priceBreakdown.tariffName}
                        </div>
                        <div className="text-lg font-bold text-white leading-none mt-1">
                            {formatPrice(priceBreakdown.totalPrice)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <Navigation className="w-3 h-3 text-primary" />
                    <span>{distance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>{Math.round(duration)} min</span>
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onCallTaxi();
                }}
                disabled={disabled}
                className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${disabled
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-lg shadow-primary/20'
                    }`}
            >
                <Phone className="w-3.5 h-3.5" />
                TAXI RUFEN
            </button>
        </div>
    );
};

export default PricePopup;
