import React, { useState, useEffect } from 'react';
import { X, Search, Save, Camera, AlertCircle, ShieldCheck } from 'lucide-react';
import type { Ticket, InspeccionDetalle, InspectionStatus, InspectionItem, ChecklistIngreso } from '../types';
import { INICIAL_CHECKLIST_ITEMS, INICIAL_INGRESO_CHECKLIST } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ImageUpload } from './ImageUpload';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onUpdate: (id: string, updates: Partial<Ticket>) => Promise<void>;
}

export function InspeccionModal({ isOpen, onClose, ticket, onUpdate }: Props) {
  const [inspeccion, setInspeccion] = useState<InspeccionDetalle | null>(null);
  const [checklistIngreso, setChecklistIngreso] = useState<ChecklistIngreso | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (ticket) {
      if (ticket.inspeccion?.checklist?.length) {
        setInspeccion(ticket.inspeccion);
      } else {
        setInspeccion({
          status_general: 'gray',
          checklist: INICIAL_CHECKLIST_ITEMS.map(item => ({
            ...item,
            status: 'gray' as InspectionStatus,
            value: ''
          })),
          exterior: { estado: '', fotos: [] },
          objetosValor: { detalle: '', fotos: [] },
          observaciones: '',
          comentarios: ''
        });
      }

      if (ticket.ingreso_checklist) {
        setChecklistIngreso(ticket.ingreso_checklist);
      } else {
        setChecklistIngreso(INICIAL_INGRESO_CHECKLIST);
      }
    } else {
      setInspeccion(null);
      setChecklistIngreso(null);
    }
  }, [ticket]);

  // Auto-calculate status_general based on severity
  useEffect(() => {
    if (!inspeccion) return;
    const statuses = inspeccion.checklist.map(i => i.status);
    let newStatus: InspectionStatus = 'gray'; // Default to gray if nothing marked
    
    if (statuses.includes('red')) newStatus = 'red';
    else if (statuses.includes('yellow')) newStatus = 'yellow';
    else if (statuses.includes('green')) newStatus = 'green';
    else newStatus = 'gray';
    
    if (newStatus !== inspeccion.status_general) {
      setInspeccion(prev => prev ? { ...prev, status_general: newStatus } : null);
    }
  }, [inspeccion?.checklist, inspeccion?.status_general]);

  if (!isOpen || !ticket || !inspeccion) return null;

  const setStatus = (id: string, s: InspectionStatus) => {
    if (!inspeccion) return;
    setInspeccion({
      ...inspeccion,
      checklist: inspeccion.checklist.map(item => item.id === id ? { ...item, status: s } : item)
    });
  };

  const updateValue = (id: string, value: string) => {
    if (!inspeccion) return;
    setInspeccion({
      ...inspeccion,
      checklist: inspeccion.checklist.map(i => i.id === id ? { ...i, value } : i)
    });
  };

  const handleSave = async () => {
    if (!inspeccion || !ticket) return;
    setSaving(true);
    try {
      await onUpdate(ticket.id, { 
        inspeccion: {
          ...inspeccion,
          updated_at: new Date().toISOString()
        },
        ingreso_checklist: checklistIngreso || undefined,
        status_general: inspeccion.status_general
      });
      onClose();
    } catch (error) {
      console.error('Error saving inspection:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-900/80 backdrop-blur-sm flex justify-center pt-8 md:pt-16 px-4 md:px-0 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden mb-16 flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Inspección de Vehículo
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-zinc-500 text-sm font-bold">Patente: {ticket.patente}</p>
            <div className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white",
                {
                  green: "bg-emerald-500",
                  yellow: "bg-amber-500",
                  red: "bg-red-500",
                  gray: "bg-zinc-400"
                }[inspeccion.status_general || 'gray']
              )}>
                Estado: {inspeccion.status_general === 'green' ? 'OK' : inspeccion.status_general === 'yellow' ? 'Precaución' : inspeccion.status_general === 'red' ? 'Urgente' : 'Pendiente'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-zinc-50 flex-1 flex flex-col gap-6">
          {/* Detailed Checklist */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-4 border-b pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Puntos de Inspección (17 Puntos)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspeccion.checklist.map((item) => (
                <div key={item.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-wider">{item.label}</span>
                    <div className="flex gap-1">
                      {(['gray', 'green', 'yellow', 'red'] as InspectionStatus[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(item.id, s)}
                          className={cn(
                            "w-6 h-6 rounded-lg transition-all border-2 flex items-center justify-center",
                            item.status === s ? {
                              green: "bg-emerald-500 border-emerald-600 shadow-sm",
                              yellow: "bg-amber-400 border-amber-500 text-white",
                              red: "bg-red-500 border-red-600 text-white",
                              gray: "bg-zinc-300 border-zinc-400"
                            }[s] : "bg-white border-transparent hover:border-zinc-200"
                          )}
                        >
                          {item.status === s && (
                            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Detalles..."
                    className="w-full bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-800 border border-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-300"
                    value={item.value}
                    onChange={(e) => updateValue(item.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ingreso Checklist Section */}
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-4 border-b pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Checklist de Recepción (Documentos y Estado)
            </h3>
            
            <div className="space-y-6">
              {checklistIngreso && Object.entries(checklistIngreso).map(([category, items]) => {
                // Handling special object categories (exterior, objects of value) separately or skipping primitives
                if (!items || typeof items !== 'object' || Array.isArray(items)) return null;
                
                if (category === 'exterior' || category === 'objetosValor') {
                  const data = items as any;
                  const value = category === 'exterior' ? data.estado : data.detalle;
                  if (!value) return null;
                  
                  return (
                    <div key={category} className="space-y-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                      <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        {category.replace(/_/g, ' ')} (RECEPCIÓN)
                      </h4>
                      <p className="text-xs font-bold text-amber-900 leading-tight">
                        {value}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{category.replace(/_/g, ' ')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(items).map(([key, value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setChecklistIngreso(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                [category]: {
                                  ...(prev[category as keyof ChecklistIngreso] as object),
                                  [key]: !value
                                }
                              };
                            });
                          }}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border transition-all text-[10px] font-bold uppercase text-left",
                            value 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                              : "bg-zinc-50 border-zinc-100 text-zinc-400 grayscale opacity-70"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                            value ? "bg-emerald-500 border-emerald-600 text-white" : "bg-white border-zinc-200"
                          )}>
                            {value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">Combustible (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={checklistIngreso?.combustible || ''}
                  onChange={(e) => setChecklistIngreso(prev => prev ? { ...prev, combustible: parseInt(e.target.value) } : null)}
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">Kilometraje (KM)</label>
                <input
                  type="number"
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={checklistIngreso?.kilometraje || ''}
                  onChange={(e) => setChecklistIngreso(prev => prev ? { ...prev, kilometraje: parseInt(e.target.value) } : null)}
                  placeholder="Ej: 50000"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">Luces Tablero</label>
                <input
                  type="text"
                  className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={checklistIngreso?.lucesTablero || ''}
                  onChange={(e) => setChecklistIngreso(prev => prev ? { ...prev, lucesTablero: e.target.value } : null)}
                  placeholder="Ej: Check engine..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-2 border-b pb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Observaciones del Cliente / Daños Preexistentes
            </h3>
            <textarea
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl resize-none min-h-[100px] text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              value={inspeccion.comentarios}
              onChange={(e) => setInspeccion({ ...inspeccion, comentarios: e.target.value })}
              placeholder="Detalles sobre especies de valor, rayones, abolladuras, etc."
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-3 border-b pb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-600" />
              Evidencia Fotográfica
            </h3>
            
            {inspeccion.observacionesUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100">
                <img src={inspeccion.observacionesUrl} alt="Evidencia Inspección" className="w-full h-full object-contain" />
                <button
                  onClick={() => setInspeccion({ ...inspeccion, observacionesUrl: undefined })}
                  className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2 text-center py-8 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                <ImageUpload
                  bucket="ticket-photos"
                  path={`inspecciones/${ticket.id}`}
                  onUploadComplete={(url) => setInspeccion({ ...inspeccion, observacionesUrl: url })}
                />
                <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-wider">Subir fotos de daños u objetos de valor</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            disabled={saving || uploading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Inspección
          </button>
        </div>
      </div>
    </div>
  );
}
