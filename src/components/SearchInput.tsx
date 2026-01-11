import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchInputProps {
  type: 'pickup' | 'destination';
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: SearchResult) => void;
  placeholder: string;
}

const SearchInput = ({ type, value, onChange, onSelect, placeholder }: SearchInputProps) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setResults(data);
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
      searchAddress(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, searchAddress]);

  const handleSelect = (result: SearchResult) => {
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
        className={`glass-input flex items-center gap-3 px-4 py-3 ${
          isFocused ? 'ring-1 ring-primary/50' : ''
        }`}
      >
        <motion.div
          animate={{
            scale: isFocused ? 1.1 : 1,
          }}
          className={`p-2 rounded-lg ${
            isPickup ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'
          }`}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            </motion.div>
          )}
          {value && !isLoading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
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
            className="absolute top-full left-0 right-0 mt-2 glass-panel p-2 z-50 max-h-60 overflow-y-auto"
          >
            {results.map((result, index) => (
              <motion.button
                key={`${result.lat}-${result.lon}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors flex items-start gap-3"
              >
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground line-clamp-2">
                  {result.display_name}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
