import { Sun, Clock, Milestone, Phone } from 'lucide-react';
import { PriceBreakdown } from '@/lib/taxiPricing';

interface PriceCardProps {
  distance: number;
  duration: number;
  priceBreakdown: PriceBreakdown;
  onCallTaxi: () => void;
}

const PriceCard = ({ distance, duration, priceBreakdown, onCallTaxi }: PriceCardProps) => {
  // Safeguard against incomplete price information
  if (!priceBreakdown || typeof priceBreakdown.totalPrice === 'undefined') {
    return null; // or a loading/error state
  }

  return (
    <div className="glass-panel p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Day Tariff</span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-4xl font-bold tracking-tight text-primary">
            €{priceBreakdown.totalPrice.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground font-medium">Taxi Konstanz</p>
        </div>

        <button
          onClick={onCallTaxi}
          className="glow-button text-primary-foreground rounded-full p-4 shadow-lg flex-shrink-0"
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-around text-sm">
        <div className="flex items-center gap-2">
          <Milestone className="w-4 h-4 text-muted-foreground" />
          <span>{distance.toFixed(1)} km</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{duration.toFixed(0)} min</span>
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
