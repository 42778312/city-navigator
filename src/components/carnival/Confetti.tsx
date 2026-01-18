import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const CONFETTI_COUNT = 50;
const COLORS = ['#FF0000', '#FFD700', '#008000', '#0000FF', '#FF00FF', '#00FFFF'];

const Confetti: React.FC = () => {
    const particles = useMemo(() => {
        return Array.from({ length: CONFETTI_COUNT }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: Math.random() * 8 + 4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 5,
            drift: (Math.random() - 0.5) * 100,
            rotation: Math.random() * 360,
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ y: -20, x: `${p.x}vw`, opacity: 0, rotate: p.rotation }}
                    animate={{
                        y: '105vh',
                        x: `${p.x + (p.drift / 10)}vw`,
                        opacity: [0, 1, 1, 0],
                        rotate: p.rotation + 360,
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear",
                    }}
                    className="absolute rounded-sm"
                    style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        boxShadow: `0 0 10px ${p.color}40`,
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;
