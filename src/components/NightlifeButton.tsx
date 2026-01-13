/**
 * NightlifeButton - Floating button to toggle nightlife visualization
 * Snapchat-style with neon gradient and animation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, MoonStar, Loader2 } from 'lucide-react';

interface NightlifeButtonProps {
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
}

const NightlifeButton = ({ onToggle, isLoading = false }: NightlifeButtonProps) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const handleClick = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onToggle(newState);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.3 }}
      whileHover={{ scale: isLoading ? 1 : 1.05 }}
      whileTap={{ scale: isLoading ? 1 : 0.95 }}
      className={`group relative px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2.5 shadow-lg backdrop-blur-sm transition-all duration-300 ${
        isEnabled
          ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-pink-500/50'
          : 'glass-panel text-foreground hover:bg-white/10'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{
        ...(isEnabled && {
          boxShadow: '0 0 30px rgba(236, 72, 153, 0.6), 0 0 60px rgba(157, 78, 221, 0.4)',
        }),
      }}
    >
      {/* Animated glow ring for enabled state */}
      <AnimatePresence>
        {isEnabled && !isLoading && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 0.3, 0.8],
            }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
              filter: 'blur(10px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className="relative z-10">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isEnabled ? (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <MoonStar className="w-5 h-5" />
          </motion.div>
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </div>

      {/* Text */}
      <span className="relative z-10">
        {isLoading ? 'Loading...' : isEnabled ? 'Hide Nightlife' : 'Show Nightlife'}
      </span>

      {/* Sparkle effect on hover */}
      {!isLoading && (
        <motion.div
          className="absolute -top-1 -right-1 text-xs"
          initial={{ scale: 0, rotate: 0 }}
          whileHover={{ scale: 1, rotate: 180 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          ✨
        </motion.div>
      )}
    </motion.button>
  );
};

export default NightlifeButton;
