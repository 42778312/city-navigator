import React from 'react';
import { Beer, Music, Car, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
    { id: 'nightlife', label: 'Nightlife', icon: Sparkles, color: 'hover:text-pink-400' },
    { id: 'bars', label: 'Bars', icon: Beer, color: 'hover:text-orange-400' },
    { id: 'live', label: 'Live Music', icon: Music, color: 'hover:text-red-400' },
    { id: 'taxi', label: 'Taxi', icon: Car, color: 'hover:text-yellow-400' },
];

interface NavTabsProps {
    activeTab: string;
    onChange: (id: string) => void;
}

const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onChange }) => {
    return (
        <div className="absolute top-6 left-0 right-0 z-[100] px-4 flex justify-center pointer-events-none">
            <div className="glass-panel p-1 md:p-1.5 flex items-center gap-0.5 md:gap-1 bg-[#1a1c23]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto max-w-full overflow-x-auto no-scrollbar scroll-smooth">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`
                                relative flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[11px] md:text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                ${isSelected
                                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(234,88,12,0.15)] scale-[1.02]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            <Icon className={`w-3.5 h-3.5 md:w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-inherit'}`} />
                            <span className="tracking-wide">{tab.label}</span>

                            {isSelected && (
                                <motion.div
                                    layoutId="activeTabGlow"
                                    className="absolute inset-0 rounded-xl bg-orange-500/5 blur-sm"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default NavTabs;
