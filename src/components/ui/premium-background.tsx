'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface PremiumBackgroundProps {
    className?: string;
    children?: React.ReactNode;
}

export function PremiumBackground({
    className,
    children
}: PremiumBackgroundProps) {
    useEffect(() => {
        // Re-initialize Unicorn Studio after render
        if ((window as any).UnicornStudio) {
            (window as any).UnicornStudio.init();
        }
    }, []);

    return (
        <div className={`relative w-full h-full overflow-hidden bg-[#000000] ${className}`}>
            {/* Dark Monochrome Gradients */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top-left soft spotlight glow - Matching screenshot exactly */}
                <motion.div
                    initial={{ opacity: 0.2, scale: 1 }}
                    animate={{
                        opacity: [0.2, 0.25, 0.2],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-[-25%] left-[-20%] w-[90%] h-[90%] rounded-full bg-white/[0.12] blur-[160px]"
                />

                {/* Removed secondary accent for clean monochrome look */}

                {/* Central shadow for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/60" />
            </div>

            {/* Unicorn Studio Background */}
            <div
                data-us-project="qPVvnWEWLLiJgYtSkKyB"
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ filter: 'grayscale(1.0)' }}
            ></div>

            {/* Subtle Noise Texture Layer */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
                    backgroundSize: '200px',
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Minimalist Grid Pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.05]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}

export default PremiumBackground;
