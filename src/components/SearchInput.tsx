import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { searchAddress, type AddressResult } from '@/lib/photonApi';

interface SearchInputProps {
  type: 'pickup' | 'destination';
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder: string;
}

const SearchInput = ({ type, value, onChange, onSelect, placeholder }: SearchInputProps) => {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search using Photon API with German language and Germany bias
      const addresses = await searchAddress(query, {
        lang: 'de',
        limit: 8,
      });
      setResults(addresses);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, performSearch]);

  const handleSelect = (result: AddressResult) => {
    onChange(result.displayLine1); // Show street + house number in input
    onSelect(result);
    setResults([]);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setResults([]);
    inputRef.current?.focus();
  };

  const isPickup = type === 'pickup';
  const Icon = isPickup ? MapPin : Navigation;

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        className={`glass-input flex items-center gap-2 px-3 py-2 ${
          isFocused ? 'ring-1 ring-primary/50' : ''
        }`}
      >
        <motion.div
          animate={{
            scale: isFocused ? 1.1 : 1,
          }}
          className={`p-1.5 rounded-lg ${
            isPickup ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </motion.div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground ${
            isPickup ? 'pr-8' : ''
          }`}
        />
        
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            </motion.div>
          )}
          {value && !isLoading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="p-0.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {results.length > 0 && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1.5 glass-panel p-1.5 z-50 max-h-52 overflow-y-auto"
          >
            {results.map((result, index) => (
              <motion.button
                key={`${result.latitude}-${result.longitude}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-start gap-2 group"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {result.displayLine1}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {result.displayLine2}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
