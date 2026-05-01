'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessStampProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

export function SuccessStamp({ isVisible, message = 'OPERACIÓN COMPLETADA', onComplete }: SuccessStampProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-brand-500/5 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.2, 1],
              rotate: -10,
              opacity: 1 
            }}
            transition={{ 
              duration: 0.5,
              times: [0, 0.7, 1],
              ease: "easeOut"
            }}
            className="relative"
          >
            {/* The Stamp Outer */}
            <div className="border-4 border-emerald-500/50 p-1 rounded-xl">
              <div className="border-2 border-emerald-500/80 px-8 py-4 rounded-lg bg-emerald-500/10 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Check className="w-12 h-12 text-emerald-400 stroke-[3px]" />
                </motion.div>
                
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-emerald-400 font-mono tracking-[0.2em] uppercase leading-none">
                    {message}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-emerald-500/60 font-bold uppercase tracking-widest">SISTEMA_OK</span>
                    <div className="w-24 h-0.5 bg-emerald-500/20" />
                    <span className="text-[10px] font-mono text-emerald-500/60 font-bold uppercase tracking-widest">V.2.4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Blueprint Lines */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 300 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1px] bg-emerald-500/20 -z-10"
            />
             <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 200 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] bg-emerald-500/20 -z-10"
            />
          </motion.div>

          {/* Particle burst emulation */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.6 }}
            className="absolute w-64 h-64 border border-emerald-500/30 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
