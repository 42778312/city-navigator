import { motion } from 'framer-motion';
import { Car, Clock, Route, Zap } from 'lucide-react';

interface PriceCardProps {
  distance: number; // in km
  duration: number; // in minutes
  price: number; // in euros
  isVisible: boolean;
}

const PriceCard = ({ distance, duration, price, isVisible }: PriceCardProps) => {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimated fare</p>
            <p className="text-xs text-muted-foreground/70">Standard ride</p>
          </div>
        </div>
        <motion.div
          key={price}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-right"
        >
          <p className="text-3xl font-display font-bold text-gradient">
            €{price.toFixed(2)}
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
        className="mt-4 pt-4 border-t border-border/50"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>Base fare €3.00 + €1.80/km</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PriceCard;
