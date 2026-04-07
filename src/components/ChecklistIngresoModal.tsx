import React, { useState } from 'react';
import { X, CheckCircle, Save, FileText, Package, Lightbulb, Droplets, Gauge, Camera, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Ticket, ChecklistIngreso, GarageSettings } from '../types';
import { INICIAL_INGRESO_CHECKLIST } from '../types';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (checklist: ChecklistIngreso) => void;
  initialData?: ChecklistIngreso | null | undefined;
  ticketPatente?: string;
  settings?: GarageSettings | null;
}

export function ChecklistIngresoModal({ isOpen, onClose, onSave, initialData, ticketPatente, settings }: Props) {
  const [checklist, setChecklist] = useState<ChecklistIngreso>(
    initialData || INICIAL_INGRESO_CHECKLIST
  );
  
  const checkedCount = Object.entries(checklist).reduce((acc: number, [key, curr]) => {
    if (curr && typeof curr === 'object' && !Array.isArray(curr)) {
      // For categories (nested objects), count booleans
      return acc + Object.values(curr).filter(v => typeof v === 'boolean' && v === true).length;
    }
    // For top-level fields (strings/numbers), count if truthy/filled
    if (['combustible', 'kilometraje', 'firmaCliente', 'observacionesGenerales'].includes(key)) {
      return acc + (curr ? 1 : 0);
    }
    return acc;
  }, 0);
  
  const totalItems = 39; // Total fields across all sections
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  const primaryColor = settings?.theme_menu_highlight || '#f97316';
  const primaryBg = `${primaryColor}20`; // 12% opacity

  const toggleCheck = (category: keyof ChecklistIngreso, field: string) => {
    setChecklist(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [field]: !(prev[category] as any)[field]
      }
    }));
  };

  const handleSave = () => {
    onSave(checklist);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/40 sticky top-0 z-20 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform" style={{ backgroundColor: primaryBg }}>
                    <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-zinc-950 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                    {progressPercent}%
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-[900] text-white italic tracking-tighter uppercase leading-none">Checklist de Ingreso</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-white/10 text-white/50 rounded-lg tracking-widest uppercase">Vehículo</span>
                    <span className="text-lg font-black text-white tracking-[0.2em]">{ticketPatente}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Estado de Revisión</p>
                  <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-brand-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-4 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Grid Content */}
            <div className="p-8 overflow-y-auto bg-zinc-950/50 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar">
              
              {/* Documentos */}
              <Section 
                title="Documentos" 
                icon={<FileText className="w-4 h-4" />} 
                color={primaryColor} 
                className="lg:col-span-1"
              >
                <div className="space-y-2">
                  {Object.entries(checklist.documentos).map(([k, v]) => (
                    <CheckItem 
                      key={k} 
                      label={k} 
                      checked={v} 
                      onChange={() => toggleCheck('documentos', k)} 
                      color={primaryColor}
                    />
                  ))}
                </div>
              </Section>

              {/* Accesorios */}
              <Section 
                title="Accesorios" 
                icon={<Package className="w-4 h-4" />} 
                color={primaryColor}
              >
                <div className="space-y-2">
                  {Object.entries(checklist.accesorios).map(([k, v]) => (
                    <CheckItem 
                      key={k} 
                      label={k} 
                      checked={v} 
                      onChange={() => toggleCheck('accesorios', k)} 
                      color={primaryColor}
                    />
                  ))}
                </div>
              </Section>

              {/* Luces */}
              <Section 
                title="Luces" 
                icon={<Lightbulb className="w-4 h-4" />} 
                color={primaryColor}
              >
                <div className="space-y-2">
                  {Object.entries(checklist.luces).map(([k, v]) => (
                    <CheckItem 
                      key={k} 
                      label={k} 
                      checked={v} 
                      onChange={() => toggleCheck('luces', k)} 
                      color={primaryColor}
                    />
                  ))}
                </div>
              </Section>

              {/* Niveles */}
              <Section 
                title="Niveles" 
                icon={<Droplets className="w-4 h-4" />} 
                color={primaryColor}
              >
                <div className="space-y-2 text-zinc-400">
                  {Object.entries(checklist.niveles).map(([k, v]) => (
                    <CheckItem 
                      key={k} 
                      label={k} 
                      checked={v} 
                      onChange={() => toggleCheck('niveles', k)} 
                      color={primaryColor}
                    />
                  ))}
                </div>
              </Section>
              
              {/* Neumáticos */}
              <Section 
                title="Neumáticos" 
                icon={<Gauge className="w-4 h-4" />} 
                color={primaryColor}
                subtitle="Estado Bueno"
              >
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(checklist.neumaticos).map(([k, v]) => (
                    <CheckItem 
                      key={k} 
                      label={k} 
                      checked={v} 
                      onChange={() => toggleCheck('neumaticos', k)} 
                      color={primaryColor}
                    />
                  ))}
                </div>
              </Section>

              {/* Estado Exterior */}
              <Section 
                title="Estado Exterior" 
                icon={<Camera className="w-4 h-4" />} 
                color={primaryColor}
              >
                <textarea
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-brand-primary/50 transition-all min-h-[100px] font-medium placeholder:text-zinc-600"
                  style={{'--tw-ring-color': primaryColor} as any}
                  value={checklist.exterior?.estado || ''}
                  onChange={(e) => setChecklist({ 
                    ...checklist, 
                    exterior: { ...(checklist.exterior || { fotos: [] }), estado: e.target.value } 
                  })}
                  placeholder="Rayas, abolladuras, estado pintura..."
                />
              </Section>

              {/* Objetos de Valor */}
              <Section 
                title="Objetos de Valor" 
                icon={<ShieldAlert className="w-4 h-4" />} 
                color={primaryColor}
              >
                <textarea
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-brand-primary/50 transition-all min-h-[100px] font-medium placeholder:text-zinc-600"
                  value={checklist.objetosValor?.detalle || ''}
                  onChange={(e) => setChecklist({ 
                    ...checklist, 
                    objetosValor: { ...(checklist.objetosValor || { fotos: [] }), detalle: e.target.value } 
                  })}
                  placeholder="Cámaras, herramientas, dinero, etc."
                />
              </Section>

              <Section 
                title="Observaciones" 
                icon={<AlertTriangle className="w-4 h-4" />} 
                color={primaryColor}
                className="lg:col-span-2"
              >
                <textarea
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-brand-primary/50 transition-all min-h-[100px] font-medium placeholder:text-zinc-600"
                  value={checklist.observacionesGenerales}
                  onChange={(e) => setChecklist({ ...checklist, observacionesGenerales: e.target.value })}
                  placeholder="Anotar detalles adicionales relevantes..."
                />
              </Section>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 border-t border-white/5 bg-zinc-900/60 backdrop-blur-xl flex justify-between items-center">
              <div className="hidden md:flex items-center gap-6 text-zinc-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-primary" style={{ backgroundColor: primaryColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Certificado por {settings?.workshop_name || 'Lubricentro'}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="px-10 py-5 text-xs font-black text-zinc-500 hover:text-white transition-all uppercase tracking-[0.2em]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-12 py-5 text-xs font-[900] text-black bg-white rounded-2xl flex items-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] group"
                >
                  <Save className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  Finalizar Revisión
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, icon, color, subtitle, children, className }: any) {
  return (
    <div className={cn("bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden group", className)}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 shadow-inner">
            {React.cloneElement(icon, { className: "w-5 h-5", style: { color } })}
          </div>
          <div>
            <h3 className="text-base font-[900] text-white uppercase tracking-wider italic">{title}</h3>
            {subtitle && <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-1">
        {children}
      </div>
    </div>
  );
}

function CheckItem({ label, checked, onChange, color }: any) {
  return (
    <label className={cn(
      "flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
      checked 
        ? "bg-white/[0.03] border-white/10 shadow-lg" 
        : "bg-transparent border-transparent hover:bg-white/5"
    )}>
      <span className={cn(
        "text-[11px] font-extrabold transition-all uppercase tracking-wider",
        checked ? "text-white translate-x-1" : "text-zinc-500 group-hover:text-zinc-400"
      )}>
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <div 
        onClick={onChange}
        className={cn(
          "w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all shadow-lg",
          checked ? "" : "border-zinc-800 bg-zinc-950"
        )}
        style={{ 
          backgroundColor: checked ? color : 'transparent',
          borderColor: checked ? color : undefined
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -45 }}
            >
              <CheckCircle className="w-3.5 h-3.5 text-zinc-950" strokeWidth={4} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    </label>
  );
}
