import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Loader2 } from 'lucide-react';

const PageLoader = () => {
    return (
        <div className="flex items-center justify-center h-full w-full min-h-[400px]">
            <div className="relative flex items-center justify-center">
                {/* Outer Glow Ring */}
                <motion.div
                    className="absolute w-24 h-24 rounded-full bg-emerald-500/20 blur-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Main Spinning Loader */}
                <motion.div
                    className="w-16 h-16 rounded-full border-[3px] border-emerald-500/10 border-t-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                
                {/* Inner Static Icon/Dot */}
                <div className="absolute w-2 h-2 rounded-full bg-emerald-400" />
            </div>
        </div>
    );
};

export default PageLoader;
