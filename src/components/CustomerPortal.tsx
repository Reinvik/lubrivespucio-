import React from 'react';
import { Ticket, TicketStatus, GarageSettings, Reminder } from '../types';
import { parseISO, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Car, Clock, ArrowLeft, CheckCircle2, Wrench, Package, AlertCircle, MapPin, Camera, Image as ImageIcon, Calendar, Phone, RotateCw, History, Star, Send, MessageSquare, ClipboardList, X, ShieldCheck, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { InspeccionDetalle, ChecklistIngreso, InspectionStatus } from '../types';
import { VehicleHistoryView } from './VehicleHistoryView';

interface CustomerPortalProps {
  ticket: Ticket | null;
  allTickets?: Ticket[];
  reminder: Reminder | null;
  settings: GarageSettings | null;
  onBack: () => void;
  onAcceptQuotation: (id: string, model: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onSaveFeedback?: (ticketId: string, rating: number, feedback: string) => Promise<void>;
}

export function CustomerPortal({ ticket, allTickets = [], reminder, settings, onBack, onAcceptQuotation, onRefresh, onSaveFeedback }: CustomerPortalProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const [feedbackRating, setFeedbackRating] = React.useState(0);
  const [feedbackHover, setFeedbackHover] = React.useState(0);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = React.useState(false);
  const [feedbackSaved, setFeedbackSaved] = React.useState(false);
  const [quotationAccepted, setQuotationAccepted] = React.useState(false);
  const [showInspectionReview, setShowInspectionReview] = React.useState(false);

  const primaryColor = settings?.theme_menu_highlight || '#f97316';

  const safeFormatDate = (dateStr: string | undefined | null) => {
    try {
      if (!dateStr) return 'N/A';
      return format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const safeFormatDateSimplified = (dateStr: string | undefined | null) => {
    try {
      if (!dateStr) return 'N/A';
      const isoDate = dateStr.substring(0, 10);
      const today = format(new Date(), 'yyyy-MM-dd');

      if (isoDate === today) {
        return 'Hoy';
      }

      const date = parseISO(`${isoDate}T00:00:00`);
      return format(date, "dd/MM/yyyy");
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  if (!ticket && !reminder) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-zinc-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Vehículo no encontrado</h2>
          <p className="text-zinc-500 mb-8">
            No encontramos ningún vehículo ni cita con esa patente en nuestro sistema. Por favor, verifica e intenta nuevamente.
          </p>
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (reminder && !ticket) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-8 px-4 font-sans">
        <div className="w-full max-w-4xl">
           <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 border border-zinc-200 shadow-inner flex items-center justify-center bg-black">
              <img src="/logo3.png" alt="Lubricentro Vespucio" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">Lubricentro Vespucio</h1>
            <p className="text-sm text-zinc-500 font-medium">Av. Américo Vespucio 310, Maipú</p>
          </div>

          <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium mb-8">
            <ArrowLeft className="w-5 h-5" /> Volver al Inicio
          </button>

          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden text-center p-12">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
               <Calendar className="w-10 h-10 text-amber-600" />
            </div>
            
            <h2 className="text-3xl font-black text-zinc-900 mb-2 uppercase tracking-tight">Cita Programada</h2>
            <p className="text-zinc-500 mb-10 text-lg font-medium leading-relaxed">
              Tenemos registrada una visita para tu vehículo <strong>{reminder.vehicle_model}</strong> con patente <span className="text-zinc-900 font-bold">{reminder.patente}</span>.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-12">
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest text-center">Fecha</p>
                <p className="text-lg font-bold text-zinc-900">
                  {reminder.planned_date ? safeFormatDateSimplified(reminder.planned_date) : 'Sin fecha'}
                </p>
              </div>
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-2 tracking-widest text-center">Hora estimada</p>
                <p className="text-lg font-bold text-zinc-900">
                  {reminder.planned_time} hrs
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100/50 mb-10 flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 mb-1 leading-tight">Tu lugar está reservado</p>
                <p className="text-sm text-emerald-700/80 font-medium">¡Te esperamos! Recuerda traer tu vehículo a la hora señalada para garantizar la rapidez del servicio.</p>
              </div>
            </div>

            <a 
              href={`https://wa.me/56990699021?text=Hola,%20consulto%20por%20mi%20cita%20del%20${safeFormatDateSimplified(reminder.planned_date)}%20patente%20${reminder.patente}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-[24px] font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95"
            >
              <Phone className="w-5 h-5" />
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }
  const primaryBg = primaryColor.startsWith('#') && primaryColor.length === 7 ? `${primaryColor}15` : 'rgba(249, 115, 22, 0.1)';

  const displaySteps = [
    'Ingreso',
    'En espera',
    'En Mantención',
    'Listo para entrega',
    'Finalizado'
  ];

  const getStepIndex = (status: TicketStatus) => {
    switch (status) {
      case 'Ingreso':
        return 0;
      case 'En espera':
        return 1;
      case 'En Mantención':
        return 2;
      case 'Listo para entrega':
        return 3;
      case 'Finalizado':
      case 'Entregado':
        return 4;
      default:
        return 0;
    }
  };

  // Ordenar tickets por fecha de entrada descendente (más reciente arriba)
  const sortedTickets = Array.isArray(allTickets) ? [...allTickets].sort((a, b) => {
    const dateA = a.entry_date ? parseISO(a.entry_date).getTime() : 0;
    const dateB = b.entry_date ? parseISO(b.entry_date).getTime() : 0;
    return dateB - dateA;
  }) : [];

  // El ticket actual es preferentemente el dictado por prop (que viene de App con logica de status)
  const displayTicket = ticket || sortedTickets[0];

  if (!displayTicket) return null;

  const currentIndex = getStepIndex(displayTicket.status);


  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-4 px-4 font-sans">
      <div className="w-full max-w-6xl">
        {/* Banner del Taller Optimizado */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-4 mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {settings?.logo_url && !logoError ? (
              <img 
                src={settings.logo_url} 
                alt={settings.workshop_name} 
                onError={() => setLogoError(true)}
                className="w-12 h-12 rounded-xl border border-zinc-100 shadow-sm object-cover" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl border border-zinc-200 shadow-inner flex items-center justify-center bg-black">
                <img src="/logo3.png" alt="Lubricentro Vespucio SPA" className="w-8 h-8 object-contain" />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tight text-zinc-900 uppercase leading-none">
                {settings?.workshop_name || 'Lubricentro Vespucio'}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                <MapPin className="w-3 h-3" />
                Av. Américo Vespucio 310, Maipú
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
              onClick={onBack}
              className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-50 transition-colors"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <a 
              href="https://wa.me/56990699021"  target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] rounded-full text-[11px] font-black uppercase tracking-wider transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
          {/* Header */}
          {/* Header con displayTicket */}
          <div className="bg-zinc-900 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            {onRefresh && (
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefresh();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
                className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all active:scale-95 disabled:opacity-50"
                title="Actualizar estado"
              >
                <RotateCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{displayTicket.model}</h1>
              </div>
              <p className="text-zinc-400 font-medium flex items-center gap-2">
                Patente: <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded-md tracking-wider leading-none" style={{ color: primaryColor }}>{displayTicket.patente || displayTicket.id}</span>
              </p>
            </div>

            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 min-w-[200px]">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1 text-center md:text-left">Reporte Actual</p>
              <p className="text-xl font-bold flex items-center justify-center md:justify-start gap-2" style={{ color: primaryColor }}>
                {displayTicket.status === 'Finalizado' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                {displayTicket.status}
              </p>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-8">
            <h3 className="text-lg font-bold text-zinc-900 mb-6 uppercase tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-400" />
              Estado del Reporte
            </h3>
            
            {/* ... Rest of the existing ticket content ... */}
            <div className="relative mb-12">
              {/* (Existing Timeline UI) */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -translate-y-1/2 rounded-full"></div>
              <div
                className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(currentIndex / (displaySteps.length - 1)) * 100}%`,
                  backgroundColor: primaryColor 
                }}
              ></div>

              <div className="relative flex justify-between">
                {displaySteps.map((status, index) => {
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <div key={status} className="flex flex-col items-center gap-3 w-20 md:w-24">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors z-10 bg-white",
                        isCompleted ? "z-20" : "border-zinc-200 text-zinc-300"
                      )} style={{ 
                        borderColor: isCompleted ? primaryColor : undefined,
                        color: isCompleted ? primaryColor : undefined,
                        backgroundColor: isCurrent ? primaryBg : undefined,
                        boxShadow: isCurrent ? `0 0 0 4px ${primaryBg}` : undefined
                      }}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current"></div>}
                      </div>
                      <span className={cn(
                        "text-[10px] md:text-xs font-semibold text-center leading-tight",
                        isCurrent ? "font-bold" : (isCompleted ? "text-zinc-700" : "text-zinc-400")
                      )} style={{ color: isCurrent ? primaryColor : undefined }}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-zinc-900 font-bold">
                    <Wrench className="w-5 h-5 text-zinc-500" />
                    Observaciones Técnicas
                  </div>
                  <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                    {displayTicket.notes || 'Sin observaciones adicionales.'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-200/50">
                  <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {safeFormatDateSimplified(displayTicket.entry_date)}
                  </div>
                  {(displayTicket.inspeccion || displayTicket.ingreso_checklist) && (
                    <button 
                      onClick={() => setShowInspectionReview(true)}
                      className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      VER INSPECCIÓN
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 text-zinc-900 font-bold">
                  <Package className="w-5 h-5 text-zinc-500" />
                  Repuestos y Materiales
                </div>
                <div className="flex-1">
                  {Array.isArray(displayTicket.spare_parts) && displayTicket.spare_parts.length > 0 ? (
                    <div className="space-y-3">
                      {displayTicket.spare_parts.map((part, idx) => (
                        <div key={idx} className="flex justify-between items-center group">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            <span className="text-sm text-zinc-600 font-medium">
                              {part.descripcion}
                              {part.cantidad && part.cantidad > 1 && (
                                <span className="ml-2 text-xs font-bold text-zinc-400">x{part.cantidad}</span>
                              )}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-zinc-900">
                            ${((part.costo || 0) * (part.cantidad || 1)).toLocaleString('es-CL')}
                          </span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-zinc-100 flex justify-end">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Total Repuestos</span>
                          <div className="text-sm font-black text-zinc-900">
                            ${displayTicket.spare_parts.reduce((acc, curr) => acc + (curr.costo || 0) * (curr.cantidad || 1), 0).toLocaleString('es-CL')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : Array.isArray(displayTicket.parts_needed) && displayTicket.parts_needed.length > 0 ? (
                    <ul className="space-y-2">
                      {displayTicket.parts_needed.map((part, idx) => (
                        <li key={idx} className="text-sm text-zinc-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                          {part}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">
                      Sin repuestos registrados.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nueva Sección: Servicios y Costos */}
            {Array.isArray(displayTicket.services) && displayTicket.services.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Servicios Detallados</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {displayTicket.services.map((service, idx) => (
                      <div key={idx} className="flex justify-between items-center group">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform"></div>
                          <span className="text-sm text-zinc-600 font-medium">
                            {service.descripcion}
                            {service.cantidad && service.cantidad > 1 && (
                              <span className="ml-2 text-xs font-bold text-emerald-500/60">x{service.cantidad}</span>
                            )}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-zinc-900">
                          ${((service.costo || 0) * (service.cantidad || 1)).toLocaleString('es-CL')}
                        </span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-zinc-100 flex justify-end">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-400 uppercase">Total Servicios</span>
                        <div className="text-lg font-black text-emerald-600">
                          ${displayTicket.services.reduce((acc, curr) => acc + (curr.costo || 0) * (curr.cantidad || 1), 0).toLocaleString('es-CL')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Total General Cotización */}
            {(() => {
              const totalServices = Array.isArray(displayTicket.services) ? displayTicket.services.reduce((acc, curr) => acc + (curr.costo || 0) * (curr.cantidad || 1), 0) : 0;
              const totalParts = Array.isArray(displayTicket.spare_parts) ? displayTicket.spare_parts.reduce((acc, curr) => acc + (curr.costo || 0) * (curr.cantidad || 1), 0) : 0;
              let total = totalServices + totalParts;
              
              if (total === 0) {
                total = displayTicket.cost || displayTicket.quotation_total || 0;
              }

              if (total === 0) return null;

              return (
                <div className="mt-6 bg-zinc-900 rounded-2xl shadow-xl overflow-hidden text-white flex flex-col sm:flex-row items-center justify-between p-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">Total</h3>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Servicios + Repuestos (C/IVA)</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-emerald-400 bg-white/5 py-3 px-6 rounded-xl border border-white/10 shadow-inner">
                    ${total.toLocaleString('es-CL')}
                  </div>
                </div>
              );
            })()}

            {/* Evidencia Fotográfica con displayTicket */}
            {(() => {
              const inspectionPhotos: string[] = [];
              if (displayTicket.inspeccion?.observacionesUrl && typeof displayTicket.inspeccion.observacionesUrl === 'string') {
                inspectionPhotos.push(displayTicket.inspeccion.observacionesUrl);
              }
              if (displayTicket.ingreso_checklist?.exterior?.fotos) {
                inspectionPhotos.push(...displayTicket.ingreso_checklist.exterior.fotos);
              }
              if (displayTicket.ingreso_checklist?.objetosValor?.fotos) {
                inspectionPhotos.push(...displayTicket.ingreso_checklist.objetosValor.fotos);
              }

              // Extraer timestamp de las fotos para filtrar las que son muy antiguas respecto a la creación del ticket
              const ticketCreationTime = displayTicket.created_at ? new Date(displayTicket.created_at).getTime() : (displayTicket.entry_date ? new Date(displayTicket.entry_date).getTime() : 0);
              
              let workPhotos = displayTicket.job_photos || [];
              
              // Si el ticket es antiguo (probablemente de cuando la patente era el ID)
              // y tiene muchas fotos, filtramos para que solo muestre las que tengan timestamp cercano al ticket
              // Un heuristico es ver si el ticket está recién creado, no mostrar fotos antiguas
              if (ticketCreationTime > 0) {
                 workPhotos = workPhotos.filter(photo => {
                    const match = photo.match(/_(\d{13})\./); // Buscar el timestamp en el formato de supabase _171... .jpg
                    if (match) {
                       const photoTime = parseInt(match[1], 10);
                       // Solo mostrar fotos que fueron tomadas a lo sumo 2 dias antes del ticket o despues
                       return photoTime >= ticketCreationTime - (2 * 24 * 60 * 60 * 1000);
                    }
                    return true; // Si no tiene timestamp, la mostramos igual (podria ocultarse pero es mas seguro no)
                 });
                 
                 // Tambien si es un ticket nuevo que esta solo Ingresado/En espera, quizas las fotos son residuales
                 if (['Ingreso', 'En espera'].includes(displayTicket.status)) {
                    // Solo mantenemos horas de hoy/recientes para evitar residuales de trabajos anteriores
                    workPhotos = workPhotos.filter(photo => {
                      const match = photo.match(/_(\d{13})\./);
                      if (match) {
                         const photoTime = parseInt(match[1], 10);
                         return photoTime >= Date.now() - (12 * 60 * 60 * 1000); // Solo ultimas 12 hrs
                      }
                      return false; // Si esta en espera, es arriesgado mostrar "fotos de trabajo" viejas
                    });
                 }
              }
              
              if (inspectionPhotos.length === 0 && workPhotos.length === 0) return null;

              return (
                <div className="space-y-6 mt-6">
                  {inspectionPhotos.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                      <div className="p-4 border-b border-zinc-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-emerald-500" />
                          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Inspección Inicial</h3>
                        </div>
                        <button 
                          onClick={() => setShowInspectionReview(true)}
                          className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          VER CHECKLIST COMPLETO
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {inspectionPhotos.map((photo, index) => (
                            <a 
                              key={index} 
                              href={photo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="aspect-square rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 group transition-all hover:ring-2 hover:ring-emerald-500/20"
                            >
                              <img 
                                src={photo} 
                                alt={`Inspección ${index + 1}`} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {workPhotos.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                      <div className="p-4 border-b border-zinc-50 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Trabajo Realizado</h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {workPhotos.map((photo, index) => (
                            <a 
                              key={index} 
                              href={photo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="aspect-square rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 group transition-all hover:ring-2 hover:ring-emerald-500/20"
                            >
                              <img 
                                src={photo} 
                                alt={`Trabajo ${index + 1}`} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Confirmar Cotizacion (Si esta En Espera) */}
            {displayTicket.status === 'En espera' && !quotationAccepted && (
              <div className="mt-8 bg-amber-50 rounded-2xl border-2 border-amber-400 overflow-hidden shadow-xl shadow-amber-500/10">
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-black text-amber-900 uppercase tracking-tight mb-2">Cotización Aprobada requerida</h3>
                  <p className="text-amber-800 font-medium mb-8">
                    Por favor, revise el detalle de servicios y repuestos. Si está de acuerdo, confirme la cotización para que comencemos a trabajar en su vehículo inmediatamente.
                  </p>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await onAcceptQuotation(displayTicket.id, displayTicket.model);
                        setQuotationAccepted(true);
                        if (onRefresh) await onRefresh();
                      } catch (e) {
                        console.error('Error al confirmar cotizacion:', e);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-lg uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <RotateCw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                    {loading ? 'Procesando...' : 'Confirmar e Iniciar Trabajo'}
                  </button>
                </div>
              </div>
            )}

            {/* Mensaje de Cotización Aceptada */}
            {quotationAccepted && (
              <div className="mt-8 bg-emerald-50 rounded-2xl border-2 border-emerald-400 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight mb-2">¡Cotización Aceptada!</h3>
                <p className="text-emerald-800 font-medium">
                  Hemos recibido tu aprobación. Tu vehículo ahora está <strong>En Mantención</strong>. 
                  Te notificaremos cuando esté listo para retiro.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── SECCIÓN DE FEEDBACK DEL CLIENTE ─── */}
        {(() => {
          const ticketDate = displayTicket.entry_date ? parseISO(displayTicket.entry_date) : null;
          const isCreationDay = ticketDate ? isToday(ticketDate) : false;
          const alreadyRated = displayTicket.customer_rating != null;

          // Si ya está guardado en esta sesión o ya existía rating
          if (feedbackSaved || alreadyRated) {
            const rating = feedbackSaved ? feedbackRating : displayTicket.customer_rating!;
            const comment = feedbackSaved ? feedbackText : displayTicket.customer_feedback;
            return (
              <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-tight">Tu Opinión</h3>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('w-7 h-7', s <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 fill-zinc-200')} />
                  ))}
                </div>
                {comment && (
                  <p className="text-sm text-zinc-600 italic leading-relaxed bg-white/60 px-4 py-3 rounded-xl border border-amber-100">
                    "{comment}"
                  </p>
                )}
                <p className="text-xs text-emerald-600 font-bold mt-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Gracias por tu opinión
                </p>
              </div>
            );
          }

          if (!isCreationDay) {
            return null; // No mostrar nada si no es el día de creación y no hay rating
          }

          return (
            <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-tight">¿Cómo fue tu atención?</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-5">Tu opinión nos ayuda a mejorar. Solo disponible hoy.</p>

              {/* Estrellas Interactivas */}
              <div className="flex gap-2 mb-5">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setFeedbackHover(star)}
                    onMouseLeave={() => setFeedbackHover(0)}
                    onClick={() => setFeedbackRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={cn(
                        'w-9 h-9 transition-colors',
                        (feedbackHover || feedbackRating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-200 fill-zinc-200'
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Texto del comentario */}
              <textarea
                rows={3}
                placeholder="Cuéntanos tu experiencia (opcional)..."
                className="w-full px-4 py-3 text-sm rounded-xl border border-amber-200 bg-white/70 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 resize-none font-medium text-zinc-700 mb-4 transition-all"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
              />

              {/* Botón Enviar */}
              <button
                type="button"
                disabled={feedbackRating === 0 || feedbackSubmitting}
                onClick={async () => {
                  if (!feedbackRating || !onSaveFeedback) return;
                  setFeedbackSubmitting(true);
                  try {
                    await onSaveFeedback(displayTicket.id, feedbackRating, feedbackText);
                    setFeedbackSaved(true);
                  } catch (e) {
                    console.error('Error saving feedback:', e);
                  } finally {
                    setFeedbackSubmitting(false);
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95',
                  feedbackRating > 0
                    ? 'bg-amber-400 hover:bg-amber-500 text-white shadow-lg shadow-amber-200'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                )}
              >
                {feedbackSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar Opinión</>
                )}
              </button>
            </div>
          );
        })()}
        {sortedTickets.length > 1 && (
          <div className="mt-12">
             <div className="bg-white rounded-3xl p-2 sm:p-4 shadow-sm border border-zinc-100/50">
               <VehicleHistoryView 
                 ticket={displayTicket}
                 allTickets={sortedTickets}
                 patente={displayTicket.patente}
                 settings={settings}
                 embedded={true}
                 hideCurrentStatus={true}
               />
             </div>
          </div>
        )}
      </div>
      
      {/* Modal de Revisión de Inspección */}
      <InspectionReviewModal 
        isOpen={showInspectionReview} 
        onClose={() => setShowInspectionReview(false)} 
        inspeccion={displayTicket?.inspeccion}
        checklistIngreso={displayTicket?.ingreso_checklist}
        patente={displayTicket?.patente || ''}
      />
    </div>
  );
}

interface InspectionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspeccion?: InspeccionDetalle;
  checklistIngreso?: ChecklistIngreso;
  patente: string;
}

function InspectionReviewModal({ isOpen, onClose, inspeccion, checklistIngreso, patente }: InspectionReviewModalProps) {
  if (!isOpen) return null;

  const getStatusLabel = (s?: InspectionStatus) => {
    if (s === 'green') return 'Correcto';
    if (s === 'yellow') return 'Precaución';
    if (s === 'red') return 'Urgente';
    return 'No revisado';
  };

  const getStatusColor = (s?: InspectionStatus) => {
    if (s === 'green') return 'bg-emerald-500';
    if (s === 'yellow') return 'bg-amber-500';
    if (s === 'red') return 'bg-red-500';
    return 'bg-zinc-300';
  };

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-900/90 backdrop-blur-md flex justify-center pt-4 md:pt-12 px-4 md:px-0 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden mb-12 flex flex-col border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-10">
          <div>
            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2 uppercase tracking-tight">
              <ClipboardList className="w-6 h-6 text-emerald-600" />
              Detalle de Inspección
            </h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Vehículo: {patente}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-zinc-50/50 flex-1 flex flex-col gap-8">
          {/* 1. Checklist de Recepción */}
          {checklistIngreso && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Recepción de Vehículo</h3>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm space-y-6">
                {/* Indicadores rápidos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Combustible</p>
                    <p className="text-sm font-black text-zinc-900">{checklistIngreso.combustible || 0}%</p>
                    <div className="w-full h-1.5 bg-zinc-200 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-emerald-500 transition-all" style={{ width: `${checklistIngreso.combustible}%` }} />
                    </div>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Kilometraje</p>
                    <p className="text-sm font-black text-zinc-900">{(checklistIngreso.kilometraje || 0).toLocaleString('es-CL')} KM</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Luces Tablero</p>
                    <p className="text-sm font-black text-zinc-900 truncate">{checklistIngreso.lucesTablero || 'Ninguna'}</p>
                  </div>
                </div>

                {/* Categorías de Documentos/Seguridad */}
                {Object.entries(checklistIngreso).map(([category, items]) => {
                  if (!items || typeof items !== 'object' || Array.isArray(items) || category === 'exterior' || category === 'objetosValor') return null;
                  
                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 pb-2">{category.replace(/_/g, ' ')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(items).map(([key, value]) => (
                          <div
                            key={key}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase transition-all",
                              value 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                : "bg-zinc-50 border-zinc-100 text-zinc-300 line-through decoration-zinc-200"
                            )}
                          >
                            {value ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <X className="w-3 h-3 text-zinc-200" />
                            )}
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Puntos Críticos de Inspección */}
          {inspeccion?.checklist && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Puntos de Inspección</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inspeccion.checklist.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tight">{item.label}</span>
                      <div className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white flex items-center gap-1",
                        getStatusColor(item.status)
                      )}>
                        {item.status === 'green' && <Check className="w-2.5 h-2.5" />}
                        {getStatusLabel(item.status)}
                      </div>
                    </div>
                    {item.value && (
                      <p className="text-xs font-medium text-zinc-500 leading-tight bg-zinc-50/50 p-2 rounded-xl italic">
                        "{item.value}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Observaciones Adicionales */}
          {(inspeccion?.comentarios || inspeccion?.observacionesUrl) && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Observaciones Adicionales</h3>
              </div>

              <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 shadow-sm space-y-4">
                {inspeccion?.comentarios && (
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-sm italic text-amber-900 leading-relaxed font-medium">
                    "{inspeccion.comentarios}"
                  </div>
                )}
                
                {inspeccion?.observacionesUrl && (
                  <div className="rounded-3xl overflow-hidden border border-zinc-100 shadow-inner bg-zinc-50 aspect-video">
                    <img 
                      src={inspeccion.observacionesUrl} 
                      alt="Evidencia fotográfica" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-100 bg-white flex justify-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-3 text-sm font-black text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-all uppercase tracking-widest active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
