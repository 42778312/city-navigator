import React from 'react';
import { Music, Car, Sparkles, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'nightlife', label: 'Nightlife', icon: Sparkles },
    { id: 'taxi', label: 'Taxi', icon: Car },
];

interface NavTabsProps {
    activeTabs: string[];
    onChange: (id: string) => void;
}

const NavTabs: React.FC<NavTabsProps> = ({ activeTabs, onChange }) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="absolute top-6 left-0 right-0 z-[100] px-4 flex flex-col items-center pointer-events-none">
            <div className="flex flex-col items-center gap-2">
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1c23]/80 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white transition-all shadow-lg active:scale-90"
                >
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="glass-panel p-1 md:p-1.5 flex items-center gap-0.5 md:gap-1 bg-[#1a1c23]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto max-w-full overflow-x-auto no-scrollbar scroll-smooth"
                        >
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isSelected = activeTabs.includes(tab.id);

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => onChange(tab.id)}
                                        className={`
                                            relative flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[11px] md:text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                            ${isSelected
                                                ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(234,88,12,0.15)] scale-[1.02]'
                                                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-3.5 h-3.5 md:w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-inherit'}`} />
                                        <span className="tracking-wide">{tab.label}</span>

                                        {isSelected && (
                                            <motion.div
                                                layoutId={`glow-${tab.id}`}
                                                className="absolute inset-0 rounded-xl bg-orange-500/5 blur-sm"
                                                initial={false}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NavTabs;
