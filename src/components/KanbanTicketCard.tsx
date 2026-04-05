import React from 'react';
import { Ticket, GarageSettings } from '../types';
import { formatDistanceToNow, parseISO, differenceInDays, formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, MoreVertical, MessageCircle, AlertCircle, History, Camera, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface KanbanTicketCardProps {
  key?: string;
  ticket: Ticket;
  settings: GarageSettings | null;
  selectedMechanic: string | null;
  isDragged: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onEdit: (ticket: Ticket) => void;
  onDelete?: (ticket: Ticket) => void;
  onShowHistory?: (ticket: Ticket) => void;
  onShowCRM?: (ticket: Ticket) => void;
  onShowChecklist?: (ticket: Ticket) => void;
  onShowInspeccion?: (ticket: Ticket) => void;
}

const statusMap: Record<string, string> = {
  'Ingreso': 'ingreso',
  'En espera': 'en espera',
  'En Mantención': 'en proceso',
  'Listo para entrega': 'listo para entrega',
  'Finalizado': 'entregado'
};

export function KanbanTicketCard({ ticket, settings, selectedMechanic, isDragged, onDragStart, onEdit, onDelete, onShowHistory, onShowCRM, onShowChecklist, onShowInspeccion }: KanbanTicketCardProps) {
  const entryDate = ticket.entry_date ? parseISO(ticket.entry_date) : new Date();
  const isValidDate = !isNaN(entryDate.getTime());
  
  // Si está finalizado, congelamos el tiempo usando close_date
  const referenceDate = (ticket.status === 'Finalizado' && ticket.close_date) 
    ? parseISO(ticket.close_date) 
    : new Date();

  const daysInShop = isValidDate ? differenceInDays(referenceDate, entryDate) : 0;
  const isAttenuated = selectedMechanic && ticket.mechanic !== selectedMechanic;

  // Determinar color de "días"
  let daysColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (daysInShop >= 3 && daysInShop < 5) daysColor = "text-amber-600 bg-amber-50 border-amber-200";
  else if (daysInShop >= 5) daysColor = "text-red-600 bg-red-50 border-red-200";

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('handleWhatsApp triggered for ticket:', ticket.id);
    if (!ticket.owner_phone) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }

    try {
      const friendlyStatus = statusMap[ticket.status] || 'en proceso';
      const vehicleModel = ticket.model || 'su vehículo';

      const tpl = settings?.whatsapp_template || 'Hola {{cliente}}, tu {{vehiculo}} está {{estado}}.';
      const message = tpl
        .replace(/{{cliente}}/g, ticket.owner_name)
        .replace(/{{vehiculo}}/g, vehicleModel)
        .replace(/{{estado}}/g, friendlyStatus)
        .replace(/{{nombre_taller}}/g, settings?.workshop_name || 'nuestro taller')
        .replace(/{{telefono_taller}}/g, settings?.phone || '');

      const encodedMessage = encodeURIComponent(message);
      const phone = ticket.owner_phone.replace(/\D/g, '');
      const url = `https://wa.me/${phone}?text=${encodedMessage}`;
      console.log('Opening WhatsApp with URL:', url);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error in handleWhatsApp:', err);
      alert("Hubo un error al intentar abrir WhatsApp. Verifique los datos del ticket.");
    }
  };

  const handleWhatsAppCotizacion = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('handleWhatsAppCotizacion triggered for ticket:', ticket.id);
    if (!ticket.owner_phone) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }

    try {
      const vehicleModel = ticket.model || 'su vehículo';
      const rawTotal = ticket.quotation_total || 0;
      const total = typeof rawTotal === 'number' ? `$${rawTotal.toLocaleString('es-CL')}` : `$${rawTotal}`;
      
      const portalLink = `${window.location.origin}/?t=${settings?.company_slug || 'consulta'}&p=${ticket.patente || ''}`;
      
      const tpl = localStorage.getItem('garage_quotation_template') || 
        'Hola {{cliente}}, ya tenemos los resultados de la inspección técnica de {{vehiculo}}.\n\nEl total de su cotización es {{total}}.\nPuede ver el detalle completo, fotos de ingreso, fotos de inspección y confirmar su presupuesto aquí: {{link_portal}}';

      const message = tpl
        .replace(/{{cliente}}/g, ticket.owner_name)
        .replace(/{{vehiculo}}/g, vehicleModel)
        .replace(/{{patente}}/g, ticket.patente || '')
        .replace(/{{total}}/g, total)
        .replace(/{{link_portal}}/g, portalLink)
        .replace(/{{nombre_taller}}/g, settings?.workshop_name || 'nuestro taller')
        .replace(/{{telefono_taller}}/g, settings?.phone || '');

      const encodedMessage = encodeURIComponent(message);
      const phone = ticket.owner_phone.replace(/\D/g, '');
      const url = `https://wa.me/${phone}?text=${encodedMessage}`;
      console.log('Opening WhatsApp Quote with URL:', url);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error in handleWhatsAppCotizacion:', err);
      alert("Hubo un error al procesar la cotización. Revise el monto total.");
    }
  };

  return (
    <div
      draggable={ticket.status !== 'Finalizado'}
      onDragStart={(e) => onDragStart(e, ticket.id)}
      onClick={() => onEdit(ticket)}
      className={cn(
        "bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm border border-zinc-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group flex flex-col gap-2",
        isDragged && "opacity-50 ring-2 ring-emerald-500",
        isAttenuated && !isDragged && "opacity-40 grayscale-[0.8] hover:opacity-100 hover:grayscale-0",
        ticket.status === 'Finalizado' && "cursor-pointer",
        ticket.status_general === 'green' && "border-emerald-100",
        ticket.status_general === 'yellow' && "border-amber-100 bg-amber-50/5",
        ticket.status_general === 'red' && "border-red-100 bg-red-50/5",
      )}
    >
      <div className="flex justify-between items-start">
        {/* Patente Estilo Placa */}
        <div className="flex flex-col min-w-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onShowCRM?.(ticket);
            }}
            className="group/plate flex items-center bg-white border-[2px] border-zinc-900 rounded-md shadow-sm mb-1.5 w-max hover:bg-zinc-50 transition-all active:scale-95 overflow-hidden ring-1 ring-zinc-200"
            title="Ver historial completo del vehículo"
          >
            <div className={cn(
              "w-1.5 h-full self-stretch flex items-center justify-center py-0.5 transition-colors duration-500",
              {
                green: "bg-emerald-500",
                yellow: "bg-amber-500",
                red: "bg-red-500",
                gray: "bg-blue-600"
              }[ticket.status_general || 'gray']
            )}>
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
            </div>
            <div className="px-1.5 py-0 flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-mono font-black text-zinc-900 tracking-wider uppercase">
                {ticket.patente || ticket.id}
              </span>
            </div>
          </button>
          <h3 className="font-bold text-zinc-900 leading-tight text-[11px] sm:text-xs truncate" title={ticket.model}>
            {ticket.model}
          </h3>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {(ticket.status === 'Ingreso' || ticket.status === 'En espera') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(ticket);
              }}
              className="text-zinc-400 hover:text-red-600 p-1 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Eliminar Ticket mal creado"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ticket);
            }}
            className="text-zinc-400 hover:text-emerald-600 p-1 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Ver/Editar Ticket"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed bg-zinc-50 p-2 rounded-lg border border-zinc-100">
        {ticket.notes || <span className="italic text-zinc-400">Sin observaciones...</span>}
      </p>

      {/* Resumen de Servicios/Insumos Realizados */}
      {((ticket.services && ticket.services.length > 0) || (ticket.spare_parts && ticket.spare_parts.length > 0)) && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {[...(ticket.services || []), ...(ticket.spare_parts || [])].slice(0, 3).map((s, idx) => (
            <div key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-black uppercase tracking-tighter truncate max-w-[120px]">
              {s.descripcion}
            </div>
          ))}
          {[...(ticket.services || []), ...(ticket.spare_parts || [])].length > 3 && (
            <div className="px-1.5 py-0.5 bg-zinc-100 text-zinc-500 border border-zinc-200 rounded text-[9px] font-black uppercase tracking-tighter">
              +{[...(ticket.services || []), ...(ticket.spare_parts || [])].length - 3} MÁS
            </div>
          )}
        </div>
      )}

      {/* Botones de Checklist e Inspección */}
      {ticket.status !== 'Finalizado' && (
        <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-zinc-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowChecklist?.(ticket);
            }}
            className={cn(
              "flex-1 py-1 px-2 rounded-lg text-[9px] font-bold transition-colors flex items-center justify-center gap-1",
              ticket.ingreso_checklist 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            )}
          >
            📋 {ticket.ingreso_checklist ? 'Checklist ✓' : 'Checklist'}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowInspeccion?.(ticket);
            }}
            className={cn(
              "flex-1 py-1 px-2 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1.5 uppercase tracking-tighter border-2",
              !ticket.inspeccion || !ticket.inspeccion.checklist || ticket.inspeccion.checklist.length === 0
                ? "bg-zinc-50 text-zinc-400 border-zinc-100 opacity-60"
                : {
                    green: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                    yellow: "bg-amber-50 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
                    red: "bg-red-50 text-red-700 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
                    gray: "bg-zinc-50 text-zinc-500 border-zinc-200"
                  }[ticket.inspeccion?.status_general || 'gray']
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              {
                green: "bg-emerald-500",
                yellow: "bg-amber-500",
                red: "bg-red-500",
                gray: "bg-zinc-300"
              }[ticket.inspeccion?.status_general || 'gray']
            )} />
            {ticket.inspeccion?.checklist && ticket.inspeccion.checklist.length > 0 ? 'Inspección' : 'Sin Inspección'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-bold truncate">
            <User className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="truncate">{ticket.mechanic}</span>
            {ticket.job_photos && ticket.job_photos.length > 0 && (
              <div className="flex items-center gap-0.5 ml-1 text-emerald-600 font-bold bg-emerald-50 px-1 rounded-sm">
                <Camera className="w-3 h-3" />
                <span>{ticket.job_photos.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span title={isValidDate ? (ticket.status === 'Finalizado' && ticket.close_date ? formatDistance(entryDate, referenceDate, { addSuffix: true, locale: es }) : formatDistanceToNow(entryDate, { addSuffix: true, locale: es })) : ''}>
              {isValidDate 
                ? (ticket.status === 'Finalizado' && ticket.close_date 
                    ? formatDistance(entryDate, referenceDate, { locale: es }) 
                    : formatDistanceToNow(entryDate, { locale: es }))
                : 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* Días en taller badge */}
          {daysInShop > 0 && (
            <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1", daysColor)}>
              {daysInShop >= 5 && <AlertCircle className="w-3 h-3" />}
              {daysInShop} día{daysInShop !== 1 ? 's' : ''}
            </div>
          )}

          {/* Botón rápido WhatsApp si está Listo para entrega o En espera */}
          {(ticket.status === 'Listo para entrega' || ticket.status === 'En espera') && (
            <button
              onClick={ticket.status === 'En espera' ? handleWhatsAppCotizacion : handleWhatsApp}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg text-[10px] font-bold transition-colors border border-emerald-200 shadow-sm"
              title={ticket.status === 'En espera' ? "Compartir Cotización" : "Avisar por WhatsApp"}
            >
              <MessageCircle className="w-3 h-3 flex-shrink-0" />
              <span>{ticket.status === 'En espera' ? 'Cotización' : 'Avisar'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
