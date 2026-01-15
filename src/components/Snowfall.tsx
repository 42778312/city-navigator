import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const SNOWFLAKE_COUNT = 30;

const Snowfall: React.FC = () => {
    // Generate snowflakes once to avoid re-renders
    const snowflakes = useMemo(() => {
        return Array.from({ length: SNOWFLAKE_COUNT }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // horizontal position %
            size: Math.random() * 4 + 2, // size in px
            duration: Math.random() * 10 + 10, // speed in seconds
            delay: Math.random() * 10, // start delay
            drift: (Math.random() - 0.5) * 40, // horizontal drift
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
            {snowflakes.map((flake) => (
                <motion.div
                    key={flake.id}
                    initial={{ y: -20, x: 0, opacity: 0 }}
                    animate={{
                        y: '105vh',
                        opacity: [0, 0.8, 0.8, 0],
                        x: [0, flake.drift, 0]
                    }}
                    transition={{
                        duration: flake.duration,
                        repeat: Infinity,
                        delay: flake.delay,
                        ease: "linear"
                    }}
                    className="absolute bg-white/30 rounded-full blur-[1px] top-0"
                    style={{
                        left: `${flake.x}%`,
                        width: flake.size,
                        height: flake.size,
                    }}
                />
            ))}
        </div>
    );
};

export default Snowfall;
