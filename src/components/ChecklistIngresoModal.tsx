import React, { useState } from 'react';
import { X, CheckCircle, Save } from 'lucide-react';
import type { Ticket, ChecklistIngreso } from '../types';
import { INICIAL_INGRESO_CHECKLIST } from '../types';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (checklist: ChecklistIngreso) => void;
  initialData?: ChecklistIngreso | null;
  ticketPatente?: string;
}

export function ChecklistIngresoModal({ isOpen, onClose, onSave, initialData, ticketPatente }: Props) {
  const [checklist, setChecklist] = useState<ChecklistIngreso>(
    initialData || INICIAL_INGRESO_CHECKLIST
  );

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[100] bg-zinc-900/80 backdrop-blur-sm flex justify-center pt-8 md:pt-16 px-4 md:px-0 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden mb-16 flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Checklist de Ingreso
            </h2>
            <p className="text-zinc-500 text-sm mt-1">Patente: {ticketPatente}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-zinc-50 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Documentos */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2">Documentos</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(checklist.documentos).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={v} onChange={() => toggleCheck('documentos', k)} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-zinc-700 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accesorios */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2">Accesorios</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(checklist.accesorios).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={v} onChange={() => toggleCheck('accesorios', k)} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-zinc-700 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Luces */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2">Luces</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(checklist.luces).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={v} onChange={() => toggleCheck('luces', k)} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-zinc-700 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Niveles */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2">Niveles</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(checklist.niveles).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={v} onChange={() => toggleCheck('niveles', k)} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-zinc-700 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Neumáticos */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200 col-span-1 md:col-span-2">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2">Neumáticos (Estado Bueno)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(checklist.neumaticos).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={v} onChange={() => toggleCheck('neumaticos', k)} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-zinc-700 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2 text-sm uppercase">Estado Exterior</h3>
            <textarea
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl resize-none min-h-[80px] text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={checklist.exterior?.estado || ''}
              onChange={(e) => setChecklist({ 
                ...checklist, 
                exterior: { ...(checklist.exterior || { fotos: [] }), estado: e.target.value } 
              })}
              placeholder="Rayas, abolladuras, estado pintura..."
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2 text-sm uppercase">Objetos de Valor</h3>
            <textarea
              className="w-full p-3 bg-zinc-50 border-zinc-200 rounded-xl resize-none min-h-[80px] text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={checklist.objetosValor?.detalle || ''}
              onChange={(e) => setChecklist({ 
                ...checklist, 
                objetosValor: { ...(checklist.objetosValor || { fotos: [] }), detalle: e.target.value } 
              })}
              placeholder="Cámaras, herramientas, dinero, etc."
            />
          </div>

          <div className="md:col-span-2 bg-white p-4 rounded-xl border border-zinc-200 flex flex-col gap-3">
            <label className="font-bold text-zinc-800 border-b pb-2 text-sm uppercase">Observaciones Generales</label>
            <textarea
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl resize-none min-h-[100px] text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={checklist.observacionesGenerales}
              onChange={(e) => setChecklist({ ...checklist, observacionesGenerales: e.target.value })}
              placeholder="Anotar detalles adicionales relevantes..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            Guardar Checklist
          </button>
        </div>
      </div>
    </div>
  );
}
