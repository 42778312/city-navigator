import { PriceBreakdown, formatPrice } from '@/lib/taxiPricing';

interface PricePopupProps {
    priceBreakdown: PriceBreakdown;
    distance: number;
    duration: number;
}

const PricePopup = ({ priceBreakdown, distance, duration }: PricePopupProps) => {
    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="price-popup">
            {/* Tariff Badge */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{priceBreakdown.tariffIcon}</span>
                <span className="text-xs font-medium text-primary">{priceBreakdown.tariffName}</span>
            </div>

            {/* Price */}
            <div className="text-center mb-2">
                <p className="text-2xl font-display font-bold text-gradient">
                    {formatPrice(priceBreakdown.totalPrice)}
                </p>
                <p className="text-xs text-muted-foreground">Taxi Konstanz</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-foreground font-medium">{distance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-foreground font-medium">{formatDuration(duration)}</span>
                </div>
            </div>
        </div>
    );
};

export default PricePopup;
