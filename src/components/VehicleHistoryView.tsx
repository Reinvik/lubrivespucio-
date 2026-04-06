import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, History, Wrench, Info, CheckCircle2, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Ticket, ServiceLogEntry } from '../types';

interface VehicleHistoryViewProps {
  ticket?: Ticket;
  patente?: string;
  allTickets?: Ticket[];
  settings?: any;
  onClose?: () => void;
  embedded?: boolean;
  hideCurrentStatus?: boolean;
}

export function VehicleHistoryView({ ticket, patente: patenteProp, allTickets = [], settings, onClose, embedded, hideCurrentStatus }: VehicleHistoryViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const effectivePatente = (patenteProp || ticket?.patente || ticket?.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  const historicalTickets = allTickets
    .filter(t => {
      const tNorm = (t.patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const idNorm = (t.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return tNorm === effectivePatente || idNorm === effectivePatente;
    })
    .sort((a, b) => new Date(b.created_at || b.entry_date).getTime() - new Date(a.created_at || a.entry_date).getTime());

  const refTicket = ticket || historicalTickets[0];

  const parseHistoryFromNotes = (notes: string): ServiceLogEntry[] => {
    if (!notes || !notes.includes('Historial de Visitas:')) return [];
    
    const entries: ServiceLogEntry[] = [];
    const lines = notes.split('\n');
    const historyRegex = /- \[(\d{4}-\d{2}-\d{2})\] (.*?)(?: \((\$\d+(?:\.\d+)*)\))?$/;

    lines.forEach(line => {
      const match = line.match(historyRegex);
      if (match) {
        const [_, date, description, costStr] = match;
        const cost = costStr ? parseInt(costStr.replace('$', '').replace(/\./g, '')) : undefined;
        
        entries.push({
          date,
          notes: description.trim(),
          parts: [],
          cost,
          mileage: undefined
        });
      }
    });

    return entries;
  };

  // Aggregate ALL service logs from ALL tickets of this vehicle
  const allServiceLogs = historicalTickets.reduce((acc: ServiceLogEntry[], t) => {
    if (t.service_log && Array.isArray(t.service_log)) {
      return [...acc, ...t.service_log];
    }
    return acc;
  }, []);

  const parsedFromNotes = historicalTickets.reduce((acc: ServiceLogEntry[], t) => {
    return [...acc, ...parseHistoryFromNotes(t.notes || '')];
  }, []);

  const visitsFromTickets = historicalTickets
    .filter(t => t.id !== ticket?.id) // Exclude current ticket from history list
    .map(t => ({
      date: t.close_date || t.entry_date || t.created_at,
      notes: (t.notes && t.notes !== '0') ? t.notes : 'Sin notas',
      parts: [
        ...(t.services?.map(s => s.descripcion) || []),
        ...(t.spare_parts?.map(p => p.descripcion) || [])
      ],
      cost: t.cost || 0,
      mileage: t.mileage,
      job_photos: t.job_photos || [],
      id: t.id
    }));

  const allVisits = [
    ...visitsFromTickets,
    ...allServiceLogs,
    ...parsedFromNotes
  ];
  
  // Robust deduplication based on ID, date, and content
  const uniqueVisits = allVisits.reduce((acc: any[], current) => {
    if (!current.date) return acc;
    const currentDateStr = new Date(current.date).toISOString().split('T')[0];
    
    const isDuplicate = acc.some(item => {
      const itemDateStr = new Date(item.date).toISOString().split('T')[0];
      
      // 1. If both have distinct IDs, they are definitely DIFFERENT visits (different tickets)
      // Even if they are on the same day.
      if (item.id && current.id && item.id !== current.id) return false;
      
      // 2. If IDs match, it's the exact same record
      if (item.id && current.id && item.id === current.id) return true;
      
      // 3. For entries on the same day:
      if (itemDateStr === currentDateStr) {
        // If one is a manual log entry and another is a ticket, 
        // and they share same description/parts and cost, assume same visit.
        // We compare content because a manual log might be a duplicate of a ticket.
        const currentContent = (current.notes || '') + (current.parts?.join(',') || '');
        const itemContent = (item.notes || '') + (item.parts?.join(',') || '');
        
        if (currentContent === itemContent && item.cost === current.cost) return true;

        // If one is a ticket (has ID) and another is a log entry without ID, 
        // and they share same date and same non-zero cost, assume same visit
        if ((item.id || current.id) && item.cost === current.cost && item.cost > 0) {
          return true;
        }
      }
      
      return false;
    });

    if (!isDuplicate) acc.push(current);
    return acc;
  }, []);

  const pastVisits = uniqueVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Find the most recent vehicle notes from any ticket
  const latestVehicleNotes = historicalTickets
    .filter(t => t.vehicle_notes)
    .sort((a, b) => new Date(b.created_at || b.entry_date).getTime() - new Date(a.created_at || a.entry_date).getTime())[0]?.vehicle_notes;

  return (
    <div className={cn("flex flex-col h-full bg-zinc-50/50 font-sans", !embedded && "p-4")}>
      {!embedded && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Historial de Servicio</h2>
            <p className="text-zinc-500 font-medium text-[10px] uppercase tracking-widest mt-0.5">Cronología para {effectivePatente}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-all active:scale-95 text-zinc-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent space-y-3">
        {/* Notas Permanentes del Vehículo */}
        {(ticket?.vehicle_notes || latestVehicleNotes) && (
          <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-2.5 shadow-sm mb-1 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-lg bg-amber-100 text-amber-600">
                <Info className="w-3 h-3" />
              </div>
              <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest leading-none">Notas del Vehículo</p>
            </div>
            <p className="text-[11px] text-amber-900 font-bold leading-relaxed whitespace-pre-wrap">
              {ticket?.vehicle_notes || latestVehicleNotes}
            </p>
          </div>
        )}

        {/* Servicio Actual (Solo si hay un ticket activo) */}
        {!hideCurrentStatus && refTicket && refTicket.status !== 'Finalizado' && refTicket.status !== 'Entregado' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-2">
            <div className="flex items-center gap-2 mb-1.5 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Servicio en Curso</span>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border-2 border-blue-100 shadow-md shadow-blue-50/30">
               <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                       <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="text-[9px] font-black text-zinc-400 uppercase tracking-tight leading-none">Estado: {refTicket.status}</div>
                       <div className="text-base font-black text-zinc-900 leading-none mt-1">#{refTicket.id.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                  {refTicket.mileage && (
                    <div className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                       <div className="text-[7px] font-black text-zinc-400 uppercase leading-none mb-0.5 whitespace-nowrap">Kilometraje</div>
                       <div className="text-[10px] font-black text-zinc-900 leading-none">{refTicket.mileage.toLocaleString()} KM</div>
                    </div>
                  )}
               </div>

                {((refTicket.services && refTicket.services.length > 0) || (refTicket.spare_parts && refTicket.spare_parts.length > 0)) && (
                  <div className="flex flex-wrap gap-1 mb-2.5">
                     {refTicket.services?.map((s, i) => (
                       <div key={i} className="text-[8px] font-bold bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 border border-zinc-200 uppercase">
                         {s.descripcion}
                       </div>
                     ))}
                     {refTicket.spare_parts?.map((p, i) => (
                       <div key={i} className="text-[8px] font-bold bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 border border-blue-100 uppercase">
                         📦 {p.descripcion}
                       </div>
                     ))}
                  </div>
                )}

               {refTicket.notes && (
                 <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-lg p-2 underline-offset-2">
                    <div className="text-[8px] font-black text-zinc-400 uppercase mb-0.5 flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" /> Notas Internas
                    </div>
                    <p className="text-[10px] text-zinc-600 italic leading-snug whitespace-pre-wrap">{refTicket.notes}</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Historial de Visitas */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-0.5 ml-1">
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Cronología de visitas</span>
          </div>

          {pastVisits.length === 0 ? (
            <div className="py-12 text-center opacity-40">
               <Calendar className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
               <p className="text-[10px] font-bold uppercase tracking-widest">Sin registros previos</p>
            </div>
          ) : (
            pastVisits.map((visit, index) => (
              <div key={`${visit.date}-${index}`} className="bg-white rounded-xl p-3 border border-zinc-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group/card relative overflow-hidden">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-zinc-50 px-2 py-0.5 rounded-lg border border-zinc-100 flex items-center gap-1">
                         <Calendar className="w-2.5 h-2.5 text-emerald-600" />
                         <span className="text-[10px] font-black text-zinc-900">{format(parseISO(visit.date), "dd MMM yyyy", { locale: es })}</span>
                      </div>
                      {visit.mileage && (
                        <div className="text-[8px] font-bold text-zinc-500 bg-zinc-100/50 px-1.5 py-0.5 rounded">
                           {visit.mileage.toLocaleString()} KM
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100 leading-none">
                      ${new Intl.NumberFormat('es-CL').format(visit.cost || 0)}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1.5">
                       {visit.parts && visit.parts.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                             {visit.parts.map((p, i) => (
                                <span key={i} className="inline-flex px-1.5 py-0.5 bg-zinc-50 text-zinc-600 rounded text-[8px] font-bold uppercase border border-zinc-100/80 leading-none">
                                   {p}
                                </span>
                             ))}
                          </div>
                       )}
                       {visit.notes && visit.notes !== 'Sin notas' && visit.notes !== '0' && (
                          <div className="relative group/notes">
                            <p className="text-[11px] text-zinc-600 leading-snug whitespace-pre-wrap italic">
                               {visit.notes}
                            </p>
                          </div>
                       )}
                    </div>

                    {visit.job_photos && visit.job_photos.length > 0 && (
                      <div className="flex gap-1 self-start flex-shrink-0">
                         {visit.job_photos.slice(0, 2).map((photo: string, i: number) => (
                            <div key={i} className="relative group/img overflow-hidden rounded-lg border border-zinc-200">
                               <img 
                                  src={photo} 
                                  className="w-10 h-10 object-cover transition-transform duration-500 group-hover/img:scale-110 cursor-zoom-in"
                                  onClick={() => setSelectedPhoto(photo)}
                                />
                               {i === 1 && visit.job_photos.length > 2 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[8px] text-white font-black pointer-events-none">
                                     +{visit.job_photos.length - 2}
                                  </div>
                               )}
                            </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full Screen Photo Viewer */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-zinc-950/95 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <button 
              className="absolute -top-14 right-0 text-white/50 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-tighter font-black text-xs bg-white/5 px-4 py-2 rounded-full border border-white/10"
              onClick={() => setSelectedPhoto(null)}
            >
              Cerrar Visualización <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedPhoto} 
              alt="Evidencia" 
              className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
