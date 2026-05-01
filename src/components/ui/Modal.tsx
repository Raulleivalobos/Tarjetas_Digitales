import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className="fixed top-0 left-0 w-full h-full z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* Centered Modal Container */}
        <div 
          className={`relative w-full ${sizeMap[size]} mx-4 bg-[#0a0e1a] border border-brand-500/40 shadow-[0_0_100px_rgba(99,102,241,0.3)] rounded-3xl flex flex-col overflow-hidden animate-fade-in`}
          style={{ maxHeight: '95vh', boxShadow: '0 0 80px rgba(0,0,0,0.8), 0 0 20px rgba(99,102,241,0.2)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modern Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5">
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 text-slate-300 hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content Area with custom scrollbar */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-gradient-to-b from-[#0a0e1a] to-[#020617]">
            {children}
          </div>
        </div>
        
        {/* Background click handler */}
        <div 
          className="absolute inset-0 -z-10" 
          onClick={onClose} 
        />
      </div>
    </Portal>
  );
}
