import { motion } from 'framer-motion';
import { Car, Clock, Route, Info } from 'lucide-react';
import { PriceBreakdown, formatPrice } from '@/lib/taxiPricing';

interface PriceCardProps {
  distance: number;
  duration: number;
  priceBreakdown: PriceBreakdown;
  isVisible: boolean;
}

const PriceCard = ({ distance, duration, priceBreakdown, isVisible }: PriceCardProps) => {
  if (!isVisible) return null;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="price-card p-5"
    >
      {/* Tariff indicator */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-primary/10 rounded-lg w-fit"
      >
        <span className="text-lg">{priceBreakdown.tariffIcon}</span>
        <span className="text-sm font-medium text-primary">{priceBreakdown.tariffName}</span>
      </motion.div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Taxi Konstanz</p>
            <p className="text-xs text-muted-foreground/70">Official tariff</p>
          </div>
        </div>
        <motion.div
          key={priceBreakdown.totalPrice}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-right"
        >
          <p className="text-3xl font-display font-bold text-gradient">
            {formatPrice(priceBreakdown.totalPrice)}
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
        >
          <Route className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="font-semibold text-foreground">{distance.toFixed(1)} km</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
        >
          <Clock className="w-4 h-4 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-semibold text-foreground">{formatDuration(duration)}</p>
          </div>
        </motion.div>
      </div>

      {/* Pricing breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 pt-4 border-t border-border/50 space-y-2"
      >
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Price breakdown</span>
        </div>
        
        {/* Base fare */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base fare</span>
          <span className="text-foreground font-medium">{formatPrice(priceBreakdown.baseFare)}</span>
        </div>

        {/* Distance pricing tiers */}
        {priceBreakdown.priceDetails.map((detail, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {detail.km.toFixed(1)} km × {formatPrice(detail.pricePerKm)}/km
            </span>
            <span className="text-foreground font-medium">{formatPrice(detail.subtotal)}</span>
          </div>
        ))}

        {/* Total */}
        <div className="flex justify-between text-sm pt-2 border-t border-border/30">
          <span className="text-foreground font-semibold">Total</span>
          <span className="text-primary font-bold">{formatPrice(priceBreakdown.totalPrice)}</span>
        </div>
      </motion.div>

      {/* Tariff info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-3 text-xs text-muted-foreground/70 text-center"
      >
        Valid from July 1, 2025 • Konstanz official rates
      </motion.div>
    </motion.div>
  );
};

export default PriceCard;
