import React, { useState, useEffect } from 'react';
import { X, Car, Calendar, History, Wrench, Edit3, Save, MessageSquare, Tag, Phone, CheckCircle2, ShieldCheck, MoreVertical, Edit2, AlertCircle, PenTool } from 'lucide-react';
import { Ticket } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { VehicleHistoryView } from './VehicleHistoryView';
import { cn } from '../lib/utils';

interface VehicleCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  allTickets?: Ticket[];
  onUpdateNotes?: (patente: string, notes: string) => Promise<void>;
  settings?: any;
}

export function VehicleCRMModal({ isOpen, onClose, ticket, allTickets = [], onUpdateNotes, settings }: VehicleCRMModalProps) {
  const [vehicleNotes, setVehicleNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [saving, setSaving] = useState(false);

  // Find the most recent vehicle notes from any ticket in the history
  const latestVehicleNotes = allTickets
    .filter(t => (t.patente || t.id).toUpperCase() === (ticket?.patente || ticket?.id)?.toUpperCase() && t.vehicle_notes)
    .sort((a, b) => new Date(b.created_at || b.entry_date).getTime() - new Date(a.created_at || a.entry_date).getTime())[0]?.vehicle_notes;

  useEffect(() => {
    if (ticket) {
      setVehicleNotes(ticket.vehicle_notes || latestVehicleNotes || '');
    }
  }, [ticket, latestVehicleNotes]);

  if (!isOpen || !ticket) return null;

  const handleSaveNotes = async () => {
    if (!onUpdateNotes || !ticket) return;
    setSaving(true);
    try {
      await onUpdateNotes(ticket.patente || ticket.id, vehicleNotes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-md flex items-center justify-center z-[60] p-4 font-sans border-0 outline-none">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative border border-zinc-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-white z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white ring-4 ring-white shadow-lg">
                <Car className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white ring-4 ring-white shadow-lg">
                <History className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight leading-none mb-1">CRM Vehicular</h2>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{ticket.model} • {ticket.patente || ticket.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-all active:scale-95 border border-transparent hover:border-zinc-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Main History (Takes 3/4) */}
          <div className="lg:col-span-3 border-r border-zinc-100 overflow-y-auto">
            <VehicleHistoryView 
              ticket={ticket} 
              allTickets={allTickets} 
              settings={settings}
              embedded
            />
          </div>

          {/* Secondary Info (Takes 1/4) */}
          <div className="lg:col-span-1 bg-zinc-50/30 p-6 overflow-y-auto space-y-6">
            
            {/* Ficha Vehículo */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-900 text-xs uppercase tracking-widest">Ficha Técnica</h3>
                <Tag className="w-4 h-4 text-zinc-300" />
              </div>
              
              <div className="space-y-4">
                <div className="group/plate inline-flex items-center bg-white border-[2px] border-zinc-900 rounded-md shadow-sm overflow-hidden ring-1 ring-zinc-100">
                  <div className="bg-blue-800 w-3 h-full self-stretch flex flex-col items-center justify-center py-1">
                    <div className="flex flex-col gap-0.5 items-center">
                      <div className="w-1.5 h-1.5 border-[0.5px] border-white/50 rounded-full flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full" />
                      </div>
                      <span className="text-[4px] text-white/70 font-bold leading-none">CHILE</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 font-black text-xl tracking-tighter text-zinc-900 uppercase">
                    {ticket.patente || ticket.id}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <div className="text-[9px] text-zinc-400 uppercase font-black leading-none mb-1.5">Marca y Modelo</div>
                    <div className="font-bold text-zinc-900 text-sm">{ticket.model}</div>
                  </div>
                  
                  {(ticket.vin || ticket.engine_id) && (
                    <div className="grid grid-cols-1 gap-2">
                      {ticket.vin && (
                        <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                          <div className="text-[9px] text-zinc-400 uppercase font-black leading-none mb-1.5 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> N° Chasis (VIN)
                          </div>
                          <div className="font-mono text-[10px] font-bold text-zinc-600 truncate" title={ticket.vin}>
                            {ticket.vin}
                          </div>
                        </div>
                      )}
                      {ticket.engine_id && (
                        <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                          <div className="text-[9px] text-zinc-400 uppercase font-black leading-none mb-1.5 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> N° Motor
                          </div>
                          <div className="font-mono text-[10px] font-bold text-zinc-600 truncate" title={ticket.engine_id}>
                            {ticket.engine_id}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ficha Dueño */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-4 text-xs uppercase tracking-widest">Propietario</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-zinc-50 shadow-sm">
                    {ticket.owner_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-black leading-none">Nombre</div>
                    <div className="font-bold text-zinc-900 text-sm">{ticket.owner_name}</div>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/56${ticket.owner_phone.replace(/\s/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group/wa hover:translate-x-1 transition-transform cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover/wa:bg-emerald-600 group-hover/wa:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-none">WhatsApp</div>
                    <div className="font-bold text-emerald-700 group-hover/wa:text-emerald-800 transition-colors flex items-center gap-1">
                      {ticket.owner_phone}
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 rounded border border-emerald-100 uppercase">Contactar</span>
                    </div>
                  </div>
                </a>

                {(ticket.rut_empresa || ticket.razon_social) && (
                  <div className="pt-4 border-t border-zinc-100 space-y-4">
                    {ticket.rut_empresa && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-black leading-none">RUT Empresa</div>
                          <div className="font-bold text-zinc-900">{ticket.rut_empresa}</div>
                        </div>
                      </div>
                    )}
                    {ticket.razon_social && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-black leading-none">Razón Social</div>
                          <div className="font-bold text-zinc-900 text-xs lines-clamp-2">{ticket.razon_social}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Observaciones Permanentes (Notas del Vehículo) */}
            <div className="bg-amber-50 rounded-2xl p-5 shadow-sm border-2 border-amber-200 animate-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                    <h3 className="font-black text-amber-900 text-[10px] uppercase tracking-[0.1em]">Notas Permanentes del Vehículo</h3>
                  </div>
                  <button 
                    onClick={() => setIsEditingNotes(true)}
                    className="p-1.5 text-amber-500 hover:text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <textarea 
                      className="w-full h-32 p-3 text-xs bg-white border-2 border-amber-300 rounded-xl focus:ring-4 focus:ring-amber-500/10 outline-none resize-none font-bold text-amber-900"
                      value={vehicleNotes}
                      onChange={(e) => setVehicleNotes(e.target.value)}
                      placeholder="Escribe notas técnicas permanentes (ej: consume aceite, perno rodado...)"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1.5 text-[10px] font-black text-amber-600 uppercase">Cancelar</button>
                      <button onClick={handleSaveNotes} disabled={saving} className="px-4 py-1.5 text-[10px] font-black bg-amber-600 text-white rounded-lg shadow-md shadow-amber-200 uppercase">
                        {saving ? 'Guardando...' : 'Fijar Nota'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group/note cursor-pointer" onClick={() => setIsEditingNotes(true)}>
                    <div className="absolute -right-1 -top-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                       <PenTool className="w-4 h-4 text-amber-400 rotate-12" />
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed font-bold italic",
                      (ticket.vehicle_notes || latestVehicleNotes) ? "text-amber-950" : "text-amber-400"
                    )}>
                      {ticket.vehicle_notes || latestVehicleNotes || 'Registra datos críticos aquí: fugas, daños previos, cuidados especiales...'}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
