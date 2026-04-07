import React, { useState, useEffect } from 'react';
import { RefreshCcw, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGarageStore } from '../hooks/useGarageStore';

export function UpdateNotifier() {
  const [show, setShow] = useState(false);
  const { settings } = useGarageStore();
  const accentColor = settings?.theme_accent_color || '#ea580c';

  useEffect(() => {
    const handleUpdate = () => {
      console.log('Update available event received!');
      setShow(true);
    };

    window.addEventListener('app-update-available', handleUpdate);
    return () => window.removeEventListener('app-update-available', handleUpdate);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 md:items-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden pointer-events-auto"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <RefreshCcw className="w-5 h-5" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-900 uppercase tracking-tight italic">Nueva Versión</h3>
                    <p className="text-[11px] text-zinc-500 font-medium">Hay una actualización disponible.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShow(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Hemos mejorado la aplicación con nuevas funciones y correcciones. Actualice para disfrutar de una mejor experiencia.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShow(false)}
                  className="flex-1 py-2.5 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 rounded-xl transition-all uppercase tracking-wider"
                >
                  Quizás luego
                </button>
                <button
                  onClick={handleReload}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-zinc-200 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ backgroundColor: accentColor }}
                >
                  Actualizar ahora
                </button>
              </div>
            </div>
            
            {/* ProgressBar decorativo */}
            <div className="h-1 w-full bg-zinc-100 overflow-hidden">
               <motion.div 
                 initial={{ x: '-100%' }}
                 animate={{ x: '100%' }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="h-full w-1/3"
                 style={{ backgroundColor: accentColor, opacity: 0.3 }}
               />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
