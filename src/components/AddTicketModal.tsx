import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { Mechanic, TicketStatus, Customer, Ticket, GarageSettings, ServiceItem, Part } from '../types';
import { X, Search, UserPlus, History, PlusCircle, Trash2, Package, Loader2, ChevronDown, Camera, AlertCircle, CheckCircle2, ShieldCheck, Upload, Trash, Clock, Car, User, Smartphone, ChevronRight, PenTool } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { InspectionStatus, INICIAL_CHECKLIST_ITEMS } from '../types';
import { VehicleHistoryView } from './VehicleHistoryView';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ticket: any) => Promise<void> | void;
  mechanics: Mechanic[];
  customers: Customer[];
  tickets: Ticket[];
  settings: GarageSettings | null;
  parts: Part[];
  onUpdatePart?: (id: string, updates: Partial<Part>) => Promise<void>;
}

export function AddTicketModal({ isOpen, onClose, onAdd, mechanics, customers, tickets, settings, parts, onUpdatePart }: AddTicketModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    model: '',
    status: 'Ingreso' as TicketStatus,
    mechanic_id: 'Sin asignar',
    owner_name: '',
    owner_phone: '',
    notes: '',
    mileage: 0,
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    spare_parts: [] as ServiceItem[],
    rut_empresa: '',
    razon_social: '',
    vehicle_notes: '' as string | undefined,
    status_general: 'gray' as InspectionStatus,
    initial_inspection: [] as any[],
    intake_details: {
      exterior: { estado: '', fotos: [] as string[] },
      objetosValor: { detalle: '', fotos: [] as string[] },
      inspeccion_general: '',
      checklist: {
        documentos: { padron: false, revisionTecnica: false, seguroObligatorio: false, permisoCirculacion: false },
        luces: { altas: false, bajas: false, freno: false, retroceso: false, intermitentes: false, patente: false, tablero: false },
        niveles: { aceiteMotor: false, liquidoFrenos: false, refrigerante: false, liquidoDireccion: false, aguaLimpiaParabrisas: false },
        accesorios: { radio: false, encendedor: false, espejos: false, plumillas: false, tapaBencina: false, tapaRueda: false, gata: false, llaveRueda: false, triangulos: false, extintor: false, botiquin: false, chaleco: false },
        neumaticos: { delanteroDerecho: false, delanteroIzquierdo: false, traseroDerecho: false, traseroIzquierdo: false, repuesto: false },
      }
    }
  });

  const [expandedSections, setExpandedSections] = useState({
    inspection: false,
    intake: false,
  });

  // INICIAL_CHECKLIST_ITEMS removed here, now imported from types.ts

  // Initialize checklist if empty
  useEffect(() => {
    if (isOpen && formData.initial_inspection.length === 0) {
      setFormData(prev => ({
        ...prev,
        initial_inspection: INICIAL_CHECKLIST_ITEMS.map(item => ({
          ...item,
          status: 'gray' as InspectionStatus,
          value: ''
        }))
      }));
    }
  }, [isOpen, INICIAL_CHECKLIST_ITEMS]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [partSearch, setPartSearch] = useState('');
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isCustomerFilled, setIsCustomerFilled] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setIsResetting(true);
      setFormData({
        id: '',
        model: '',
        status: 'Ingreso',
        mechanic_id: 'Sin asignar',
        owner_name: '',
        owner_phone: '',
        notes: '',
        mileage: 0,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        spare_parts: [],
        rut_empresa: '',
        razon_social: '',
        vehicle_notes: '',
        status_general: 'gray' as InspectionStatus,
        initial_inspection: INICIAL_CHECKLIST_ITEMS.map(item => ({
          ...item,
          status: 'gray' as InspectionStatus,
          value: ''
        })),
        intake_details: {
          exterior: { estado: '', fotos: [] as string[] },
          objetosValor: { detalle: '', fotos: [] as string[] },
          inspeccion_general: '',
          checklist: {
            documentos: { padron: false, revisionTecnica: false, seguroObligatorio: false, permisoCirculacion: false },
            luces: { altas: false, bajas: false, freno: false, retroceso: false, intermitentes: false, patente: false, tablero: false },
            niveles: { aceiteMotor: false, liquidoFrenos: false, refrigerante: false, liquidoDireccion: false, aguaLimpiaParabrisas: false },
            accesorios: { radio: false, encendedor: false, espejos: false, plumillas: false, tapaBencina: false, tapaRueda: false, gata: false, llave_rueda: false, triangulos: false, extintor: false, botiquin: false, chaleco: false },
            neumaticos: { delanteroDerecho: false, delanteroIzquierdo: false, traseroDerecho: false, traseroIzquierdo: false, repuesto: false },
          }
        }
      });
      setCustomerSearch('');
      setIsCustomerFilled(false);
      setPartSearch('');
      setShowPartDropdown(false);
      setTimeout(() => setIsResetting(false), 50);
    }
  }, [isOpen, INICIAL_CHECKLIST_ITEMS]);

  // Auto-calculate status_general based on severity
  useEffect(() => {
    const statuses = formData.initial_inspection.map(i => i.status);
    let newStatus: InspectionStatus = 'gray'; // Default to gray
    if (statuses.includes('red')) newStatus = 'red';
    else if (statuses.includes('yellow')) newStatus = 'yellow';
    else if (statuses.includes('green')) newStatus = 'green';
    else newStatus = 'gray';
    
    if (newStatus !== formData.status_general) {
      setFormData(prev => ({ ...prev, status_general: newStatus }));
    }
  }, [formData.initial_inspection, formData.status_general]);

  const toggleChecklistStatus = (id: string) => {
    const statusCycle: InspectionStatus[] = ['gray', 'green', 'yellow', 'red'];
    setFormData(prev => ({
      ...prev,
      initial_inspection: prev.initial_inspection.map(item => {
        if (item.id === id) {
          const currentIndex = statusCycle.indexOf(item.status);
          const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
          return { ...item, status: nextStatus };
        }
        return item;
      })
    }));
  };

  const updateChecklistValue = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      initial_inspection: prev.initial_inspection.map(item => 
        item.id === id ? { ...item, value } : item
      )
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'exterior' | 'objetosValor') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newPhotos: string[] = [];

    for (const file of fileList) {
      const currentFile = file as any;
      const fileExt = currentFile.name.split('.').pop() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `intake/${category}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-photos')
        .upload(filePath, currentFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`
        });

      if (uploadError) {
        console.error('Error uploading file to ticket-photos:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-photos')
        .getPublicUrl(filePath);

      newPhotos.push(publicUrl);
    }

    setFormData(prev => ({
      ...prev,
      intake_details: {
        ...prev.intake_details,
        [category === 'exterior' ? 'exterior' : 'objetosValor']: {
          ...prev.intake_details[category === 'exterior' ? 'exterior' : 'objetosValor'],
          fotos: [...prev.intake_details[category === 'exterior' ? 'exterior' : 'objetosValor'].fotos, ...newPhotos]
        }
      }
    }));
  };

  const removePhoto = (category: 'exterior' | 'objetosValor', photoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      intake_details: {
        ...prev.intake_details,
        [category === 'exterior' ? 'exterior' : 'objetosValor']: {
          ...prev.intake_details[category === 'exterior' ? 'exterior' : 'objetosValor'],
          fotos: prev.intake_details[category === 'exterior' ? 'exterior' : 'objetosValor'].fotos.filter(p => p !== photoUrl)
        }
      }
    }));
  };

  const primaryColor = settings?.theme_button_color || '#f97316';

  const selectCustomer = (item: any) => {
    // Determine the correct plate to use for the input field
    const plate = (item.patente || item.id || '').toUpperCase();
    
    setFormData(prev => ({
      ...prev,
      id: plate,
      owner_name: (item.name || item.owner_name) || prev.owner_name,
      owner_phone: (item.phone || item.owner_phone) || prev.owner_phone,
      model: (item.last_model || item.model) || prev.model,
      rut_empresa: item.rut_empresa || prev.rut_empresa,
      razon_social: item.razon_social || prev.razon_social,
      vehicle_notes: item.vehicle_notes || prev.vehicle_notes,
      vin: (item.last_vin || item.vin) || prev.vin,
      engine_id: (item.last_engine_id || item.engine_id) || prev.engine_id,
    }));
    setIsCustomerFilled(true);
    setCustomerSearch('');
    setShowCustomerSearch(false);
  };

  // Customer search effect
  useEffect(() => {
    if (isResetting) return;
    const searchTrimmed = customerSearch.trim();
    if (searchTrimmed.length >= 2 && !isCustomerFilled) {
      const searchLower = searchTrimmed.toLowerCase();
      const results: any[] = [];

      customers.forEach(c => {
        const nameMatch = c.name?.toLowerCase().includes(searchLower);
        const phoneMatch = c.phone?.includes(searchTrimmed);
        const emailMatch = c.email?.toLowerCase().includes(searchLower);

        if (nameMatch || phoneMatch || emailMatch) {
          c.vehicles?.forEach(v => {
            results.push({ ...c, id: v, type: 'customer', matchType: nameMatch ? 'Usuario' : phoneMatch ? 'Teléfono' : 'Email' });
          });
        } else {
          c.vehicles?.forEach(v => {
            if (v.toLowerCase().includes(searchLower)) {
              results.push({ ...c, id: v, type: 'customer', matchType: 'Patente' });
            }
          });
        }
      });

      tickets.forEach(t => {
        const patenteMatch = t.patente?.toLowerCase().includes(searchLower);
        const idMatch = t.id.toLowerCase().includes(searchLower);
        const ownerMatch = t.owner_name?.toLowerCase().includes(searchLower);

        if (patenteMatch || idMatch || ownerMatch) {
          if (!results.some(r => r.id === (t.patente || t.id))) {
            results.push({ 
              ...t, 
              id: t.patente || t.id, // We want the plate to be the ID in the input
              type: 'ticket', 
              matchType: patenteMatch ? 'Patente Histórica' : idMatch ? 'ID Ticket' : 'Dueño Histórico' 
            });
          }
        }
      });

      const uniqueResults: any[] = [];
      const seenPlates = new Set<string>();
      results.forEach(r => {
        if (!seenPlates.has(r.id)) {
          uniqueResults.push(r);
          seenPlates.add(r.id);
        }
      });

      // Perfect match priority: if we find an EXACT match for the plate (e.g. 6 chars exact)
      const exactMatch = uniqueResults.find(r => r.id?.toLowerCase() === searchLower);
      if (exactMatch && !isCustomerFilled) {
          selectCustomer(exactMatch);
          setFilteredCustomers([]);
          setShowCustomerSearch(false);
          return;
      }

      setFilteredCustomers(uniqueResults.slice(0, 8));
      setShowCustomerSearch(uniqueResults.length > 0);
    } else {
      setShowCustomerSearch(false);
    }
  }, [customerSearch, customers, tickets, isCustomerFilled, isResetting]);

  const filteredInventory = useMemo(() => {
    const search = partSearch.toLowerCase();
    if (!search) return [];
    return parts.filter(p => (
      p.name.toLowerCase().includes(search) ||
      p.id.toLowerCase().includes(search) ||
      p.price.toString().includes(search)
    ) && !formData.spare_parts.some(sp => sp.part_id === p.id));
  }, [partSearch, parts, formData.spare_parts]);

  const handleSelectInventoryPart = (part: Part) => {
    setFormData(prev => ({
      ...prev,
      spare_parts: [...prev.spare_parts, { descripcion: part.name, costo: part.price, cantidad: 1, part_id: part.id }]
    }));
    setPartSearch('');
    setShowPartDropdown(false);
  };

  const handleAddSparePart = () => {
    setFormData(prev => ({
      ...prev,
      spare_parts: [...prev.spare_parts, { descripcion: '', costo: 0, cantidad: 1 }]
    }));
  };

  const handleRemoveSparePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      spare_parts: prev.spare_parts.filter((_, i) => i !== index)
    }));
  };

  const handleSparePartChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    const newParts = [...formData.spare_parts];
    if (field === 'costo' || field === 'cantidad') {
      const numVal = Number(value);
      newParts[index][field] = isNaN(numVal) ? 0 : numVal;
    } else {
      (newParts[index] as any)[field] = value as string;
    }
    setFormData(prev => ({ ...prev, spare_parts: newParts }));
  };

  const totalEstimatedCost = formData.spare_parts.reduce((acc, curr) => acc + (curr.costo || 0) * (curr.cantidad ?? 1), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const ticketId = formData.id.toUpperCase();
    const ticketToSubmit = {
      ...formData,
      id: ticketId,
      patente: ticketId,
      // 'inspeccion' maps to InspeccionDetalle (checklist for technical items + exterior/valuables)
      inspeccion: {
        checklist: formData.initial_inspection,
        exterior: formData.intake_details.exterior,
        objetosValor: formData.intake_details.objetosValor,
        observaciones: formData.intake_details.inspeccion_general,
        comentarios: formData.notes,
        status_general: formData.status_general
      },
      // 'ingreso_checklist' maps to ChecklistIngreso (documents, lights, etc.)
      ingreso_checklist: {
        ...formData.intake_details.checklist,
        exterior: formData.intake_details.exterior,
        objetosValor: formData.intake_details.objetosValor,
        combustible: 0,
        kilometraje: formData.mileage,
        lucesTablero: "",
        observacionesGenerales: formData.intake_details.inspeccion_general,
      },
      cost: totalEstimatedCost,
      total_estimated_cost: totalEstimatedCost,
      status_general: formData.status_general
    };

    if (onUpdatePart) {
      for (const item of formData.spare_parts) {
        if (item.part_id) {
          const isLabor = item.descripcion.toUpperCase().includes('SERVICIO') || 
                          item.descripcion.toUpperCase().includes('M.O.') || 
                          item.descripcion.toLowerCase().includes('mano de obra');
          
          if (isLabor) continue;

          const part = parts.find(p => p.id === item.part_id);
          const qty = item.cantidad ?? 1;
          if (part && part.stock > 0) {
            await onUpdatePart(item.part_id, { stock: Math.max(0, part.stock - qty) });
          }
        }
      }
    }

    try {
      await onAdd(ticketToSubmit);
      onClose();
    } catch (error) {
      console.error('Error adding ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Nuevo Ingreso de Vehículo</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Completa la ficha técnica para iniciar la recepción.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-white transition-colors border border-transparent hover:border-zinc-200 shadow-none hover:shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-zinc-100" style={{ backgroundColor: `${primaryColor}10` }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors" style={{ color: primaryColor }} />
            <input
              type="text"
              placeholder="BUSCAR: Patente, Nombre, Teléfono..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold text-lg bg-white shadow-sm focus:ring-4 placeholder:text-zinc-300"
              style={{ 
                  borderColor: customerSearch.length >= 3 ? primaryColor : `${primaryColor}20`,
                  boxShadow: customerSearch.length >= 3 ? `0 0 0 4px ${primaryColor}15` : undefined,
                  "--tw-ring-color": `${primaryColor}20`
              } as any}
              value={customerSearch}
              onChange={e => {
                setCustomerSearch(e.target.value);
                setIsCustomerFilled(false);
              }}
            />
            {showCustomerSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto">
                <div className="p-3 border-b border-zinc-50 bg-zinc-50/50">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Coincidencias Encontradas</span>
                </div>
                {filteredCustomers.map((c: any) => (
                  <button
                    key={`${c.id}-${c.type}`}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full px-5 py-4 text-left transition-colors flex items-center justify-between border-b border-zinc-50 last:border-0 hover:bg-emerald-50/50 group"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-extrabold text-zinc-900 text-base truncate">{(c.name || c.owner_name)}</div>
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-zinc-100 text-zinc-400 rounded-md uppercase tracking-widest leading-none">
                          {c.matchType}
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono flex items-center gap-2" style={{ color: primaryColor }}>
                        <span className="px-2 py-0.5 rounded border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>{c.id}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-zinc-400 font-sans">{(c.phone || c.owner_phone)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Información Principal</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Patente (ID)</label>
                    <input
                      required
                      type="text"
                      placeholder="ABCD12"
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-black text-zinc-800 tracking-widest uppercase bg-zinc-50/30 focus:ring-4"
                      value={formData.id}
                      onChange={e => {
                        const newVal = e.target.value.toUpperCase().replace(/\s/g, '');
                        setFormData(prev => ({ ...prev, id: newVal }));
                        
                        // Si borra casi todo, permitimos reconocimiento de nuevo
                        if (newVal.length < 3) setIsCustomerFilled(false);

                        // Auto-fill lookup if typing directly in the plate field
                        if (newVal.length >= 4 && !isCustomerFilled) {
                          const normalizedInput = newVal.replace(/[^A-Z0-9]/g, '');
                          
                          const match = tickets.find(t => {
                            const tPlate = (t.patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                            const tId = t.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            return tPlate === normalizedInput || (tId === normalizedInput && tId.length < 10);
                          }) || customers.find(c => 
                            c.vehicles?.some(v => v.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedInput)
                          );
                          
                          if (match) {
                            selectCustomer(match);
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado Inicial</label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-bold text-zinc-800 bg-zinc-50/30 focus:ring-4 appearance-none"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as TicketStatus })}
                    >
                      <option value="Ingreso">Ingreso</option>
                      <option value="En espera">En espera</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Marca y Modelo</label>
                  <input
                    required
                    type="text"
                    placeholder="Toyota Hilux 2024"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-bold text-zinc-800 bg-zinc-50/30 focus:ring-4"
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-zinc-50/50 p-4 rounded-2xl border border-dashed border-zinc-200 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Semáforo de Ingreso</span>
                  <div className="flex gap-1.5">
                    {(['green', 'yellow', 'red'] as InspectionStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status_general: s }))}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 transition-all cursor-pointer",
                          formData.status_general === s ? {
                            gray: "bg-zinc-100 border-zinc-400",
                            green: "bg-emerald-500 text-white shadow-sm",
                            yellow: "bg-yellow-400 border-yellow-500 shadow-sm shadow-yellow-500/20",
                            red: "bg-red-500 border-red-600 shadow-sm shadow-red-500/20"
                          }[s] : "bg-transparent border-zinc-200 opacity-30 hover:opacity-100"
                        )}
                        style={formData.status_general === 'green' && s === 'green' ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Resumen de Inspección
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-lg border border-zinc-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-zinc-400 uppercase">Items</span>
                      <span className="text-[10px] font-black text-zinc-900">{formData.initial_inspection.filter(i => i.status !== 'green').length > 0 ? formData.initial_inspection.filter(i => i.status !== 'gray').length : 0}/17</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-zinc-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-zinc-400 uppercase">Fotos</span>
                      <span className="text-[10px] font-black text-zinc-900">
                        {formData.intake_details.exterior.fotos.length + formData.intake_details.objetosValor.fotos.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NOTAS PERMANENTES DEL VEHICULO */}
          {formData.vehicle_notes && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                     <PenTool className="w-4 h-4 text-amber-500 rotate-12" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                    <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Atención: Notas Permanentes</h3>
                  </div>
                  <p className="text-xs text-amber-900 font-bold leading-relaxed italic">
                    "{formData.vehicle_notes}"
                  </p>
               </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-zinc-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Cliente y Kilometraje</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre del Cliente</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-bold bg-zinc-50/30 focus:ring-4"
                  value={formData.owner_name}
                  onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teléfono (WhatsApp)</label>
                <input
                  required
                  type="tel"
                  placeholder="+56 9..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-bold bg-zinc-50/30 focus:ring-4 font-mono"
                  value={formData.owner_phone}
                  onChange={e => setFormData({ ...formData, owner_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Kilometraje (KM)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all font-bold text-zinc-800 bg-zinc-50/30 focus:ring-4"
                  value={formData.mileage || ''}
                  onChange={e => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* VEHICLE HISTORY SECTION (Conditional) */}
          {formData.id && tickets.some(t => t.patente?.toUpperCase() === formData.id.toUpperCase() || t.id.toUpperCase() === formData.id.toUpperCase()) && (
            <div className="space-y-4 pt-4 border-t border-zinc-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Historial de este Vehículo</h3>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                  {tickets.filter(t => t.patente?.toUpperCase() === formData.id.toUpperCase() || t.id.toUpperCase() === formData.id.toUpperCase()).length} registros
                </span>
              </div>
              <div className="bg-zinc-50/50 rounded-2xl border border-zinc-100 overflow-hidden">
                <VehicleHistoryView 
                  patente={formData.id} 
                  allTickets={tickets} 
                  onClose={() => {}} 
                  embedded={true}
                />
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-zinc-50">
            <button
              type="button"
              onClick={() => setExpandedSections(prev => ({ ...prev, inspection: !prev.inspection }))}
              className={cn(
                "w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group overflow-hidden relative",
                expandedSections.inspection 
                  ? "bg-white shadow-lg ring-4" 
                  : "bg-zinc-50/50 border-zinc-100 hover:bg-white"
              )}
              style={{
                borderColor: expandedSections.inspection ? primaryColor : undefined,
                boxShadow: expandedSections.inspection ? `0 10px 15px -3px ${primaryColor}15` : undefined,
                "--tw-ring-color": `${primaryColor}10`
              } as any}
            >
              {expandedSections.inspection && (
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: primaryColor }}></div>
              )}
              <div className="flex items-center gap-4 relative z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{ 
                    backgroundColor: expandedSections.inspection ? primaryColor : `${primaryColor}15`,
                    color: expandedSections.inspection ? 'white' : primaryColor
                  }}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Inspección Técnica Inicial</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Estado del vehículo y niveles</span>
                    {formData.initial_inspection.some(i => i.status !== 'gray') && !expandedSections.inspection && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                        <span className="text-[10px] font-black uppercase" style={{ color: primaryColor }}>Iniciada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown 
                className="w-5 h-5 transition-transform duration-300" 
                style={{ color: expandedSections.inspection ? primaryColor : undefined }} 
              />
            </button>

            {expandedSections.inspection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                {formData.initial_inspection.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group"
                    style={{ '--hover-border': primaryColor } as any}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-zinc-600 uppercase tracking-wider">{item.label}</span>
                        <div className="flex gap-1">
                          {(['gray', 'green', 'yellow', 'red'] as InspectionStatus[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  initial_inspection: prev.initial_inspection.map(i => i.id === item.id ? { ...i, status: s } : i)
                                }));
                              }}
                              className={cn(
                                "w-6 h-6 rounded-lg transition-all border-2 flex items-center justify-center",
                                item.status === s ? {
                                  gray: "bg-zinc-300 border-zinc-400 text-zinc-600 shadow-sm",
                                  green: "bg-emerald-500 border-emerald-600 text-white shadow-sm",
                                  yellow: "bg-yellow-400 border-yellow-500 text-white shadow-sm",
                                  red: "bg-red-500 border-red-600 text-white shadow-sm"
                                }[s] : "bg-zinc-50 border-transparent hover:border-zinc-200"
                              )}
                              style={item.status === 'green' && s === 'green' ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                            >
                              {item.status === s && (
                                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Notas o detalles..."
                          className="w-full bg-zinc-50/50 px-3 py-2 rounded-xl text-xs font-bold text-zinc-800 focus:bg-white focus:ring-2 outline-none transition-all placeholder:text-zinc-300"
                          style={{ "--tw-ring-color": `${primaryColor}20` } as any}
                          value={item.value}
                          onChange={(e) => updateChecklistValue(item.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: INTAKE PHOTOS */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setExpandedSections(prev => ({ ...prev, intake: !prev.intake }))}
              className={cn(
                "w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group overflow-hidden relative",
                expandedSections.intake 
                  ? "bg-white border-blue-500 shadow-lg shadow-blue-500/10 ring-4 ring-blue-50" 
                  : "bg-zinc-50/50 border-zinc-100 hover:border-blue-200 hover:bg-white"
              )}
            >
              {expandedSections.intake && (
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
              )}
              <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  expandedSections.intake ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
                )}>
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Detalles de Ingreso</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Estado exterior y objetos de valor</span>
                    {(formData.intake_details.exterior.fotos.length > 0 || formData.intake_details.objetosValor.fotos.length > 0) && !expandedSections.intake && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span className="text-[10px] font-black text-blue-600 uppercase">
                          {formData.intake_details.exterior.fotos.length + formData.intake_details.objetosValor.fotos.length} Fotos
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", expandedSections.intake ? "rotate-180 text-blue-500" : "text-zinc-400 group-hover:text-blue-500")} />
            </button>

            {expandedSections.intake && (
              <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Checklist Detallado - Premium Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(formData.intake_details.checklist).map(([category, items]: [string, any]) => {
                    const CategoryIcon = ({
                      documentos: ShieldCheck,
                      luces: Camera,
                      niveles: AlertCircle,
                      accesorios: Package,
                      neumaticos: ShieldCheck,
                    } as any)[category] || Package;

                    const KEY_LABELS: Record<string, string> = {
                      padron: 'Padrón',
                      revisionTecnica: 'Rev. Técnica',
                      seguroObligatorio: 'Seguro Oblig.',
                      permisoCirculacion: 'Permiso Circ.',
                      altas: 'Altas',
                      bajas: 'Bajas',
                      freno: 'Freno',
                      retroceso: 'Retroceso',
                      intermitentes: 'Interm.',
                      patente: 'Luz Patente',
                      tablero: 'Tablero',
                      aceiteMotor: 'Aceite Motor',
                      liquidoFrenos: 'Liq. Frenos',
                      refrigerante: 'Refrigerante',
                      liquidoDireccion: 'Liq. Direcc.',
                      aguaLimpiaParabrisas: 'Limpia Parab.',
                      radio: 'Radio',
                      encendedor: 'Encendedor',
                      espejos: 'Espejos',
                      plumillas: 'Plumillas',
                      tapaBencina: 'Tapa Comb.',
                      tapaRueda: 'Tapa Rueda',
                      gata: 'Gata',
                      llaveRueda: 'Llave Rueda',
                      triangulos: 'Triángulos',
                      extintor: 'Extintor',
                      botiquin: 'Botiquín',
                      chaleco: 'Chaleco Ref.',
                      delanteroDerecho: 'Del. Der.',
                      delanteroIzquierdo: 'Del. Izq.',
                      traseroDerecho: 'Tras. Der.',
                      traseroIzquierdo: 'Tras. Izq.',
                      repuesto: 'Repuesto'
                    };
                    
                    return (
                      <div key={category} className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="bg-zinc-50/50 px-4 py-3 border-b border-zinc-100 flex items-center gap-2 group-hover:bg-white transition-colors">
                          <div className="p-1.5 rounded-lg bg-white border border-zinc-200">
                            <CategoryIcon className="w-3.5 h-3.5 text-zinc-500" />
                          </div>
                          <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest leading-none">{category === 'neumaticos' ? 'Neumáticos' : category.toUpperCase()}</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          {Object.entries(items).map(([itemKey, value]: [string, any]) => (
                            <label key={itemKey} className="flex items-center justify-between group/row cursor-pointer">
                              <span className="text-[10px] font-bold text-zinc-500 group-hover/row:text-zinc-900 transition-colors uppercase tracking-tight">
                                {KEY_LABELS[itemKey] || itemKey}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    intake_details: {
                                      ...prev.intake_details,
                                      checklist: {
                                        ...prev.intake_details.checklist,
                                        [category]: {
                                          ...prev.intake_details.checklist[category as keyof typeof prev.intake_details.checklist],
                                          [itemKey]: !value
                                        }
                                      }
                                    }
                                  }))
                                }}
                                className={cn(
                                  "w-9 h-5 rounded-full transition-all relative flex items-center px-1 border",
                                  value 
                                    ? "justify-end shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" 
                                    : "bg-zinc-100 border-zinc-200 justify-start h-5"
                                )}
                                style={value ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                              >
                                <div className={cn(
                                  "w-3 h-3 rounded-full shadow-sm transition-transform",
                                  value ? "bg-white" : "bg-zinc-400"
                                )} />
                              </button>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                      Estado Exterior (Rayones / Abolladuras)
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe el estado visual del vehículo..."
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-100 outline-none text-sm font-bold bg-zinc-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.intake_details.exterior.estado}
                    onChange={e => setFormData({
                      ...formData,
                      intake_details: { ...formData.intake_details, exterior: { ...formData.intake_details.exterior, estado: e.target.value } }
                    })}
                  />
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {formData.intake_details.exterior.fotos.map((url, i) => (
                      <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 shadow-sm group bg-zinc-100">
                        <img src={url} alt="Ext" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removePhoto('exterior', url)} 
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer text-zinc-400 transition-all group">
                      <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black mt-1 uppercase">Subir</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'exterior')} />
                    </label>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                      Objetos de Valor Declarados
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Ej: Radio, Rueda repuesto, Kit herramientas..."
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-100 outline-none text-sm font-bold bg-zinc-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.intake_details.objetosValor.detalle}
                    onChange={e => setFormData({
                      ...formData,
                      intake_details: { ...formData.intake_details, objetosValor: { ...formData.intake_details.objetosValor, detalle: e.target.value } }
                    })}
                  />
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {formData.intake_details.objetosValor.fotos.map((url, i) => (
                      <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 shadow-sm group bg-zinc-100">
                        <img src={url} alt="Val" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removePhoto('objetosValor', url)} 
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer text-zinc-400 transition-all group">
                      <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black mt-1 uppercase">Subir</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'objetosValor')} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* SECTION: SPARE PARTS / BUDGET */}
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Presupuesto Estimado</h3>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar repuesto..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 outline-none text-sm"
                  value={partSearch}
                  onChange={e => { setPartSearch(e.target.value); setShowPartDropdown(true); }}
                  onFocus={() => setShowPartDropdown(true)}
                />
              </div>
              {showPartDropdown && filteredInventory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {filteredInventory.map(part => (
                    <button key={part.id} type="button" onClick={() => handleSelectInventoryPart(part)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-left border-b border-zinc-50 last:border-0 text-sm">
                      <span className="font-medium">{part.name}</span>
                      <span className="font-black text-zinc-600">${part.price.toLocaleString('es-CL')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {formData.spare_parts.map((part, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    className="col-span-6 px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                    value={part.descripcion}
                    onChange={(e) => handleSparePartChange(index, 'descripcion', e.target.value)}
                  />
                  <input
                    type="number"
                    className="col-span-2 px-2 py-2 rounded-lg border border-zinc-200 text-sm text-center"
                    value={part.cantidad ?? ''}
                    onChange={(e) => handleSparePartChange(index, 'cantidad', e.target.value)}
                  />
                  <input
                    type="number"
                    className="col-span-3 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-bold"
                    value={part.costo || ''}
                    onChange={(e) => handleSparePartChange(index, 'costo', e.target.value)}
                  />
                  <button type="button" onClick={() => handleRemoveSparePart(index)} className="col-span-1 text-zinc-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddSparePart} className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 mt-2">
                <PlusCircle className="w-4 h-4" /> Agregar item
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <div className="px-4 py-2 rounded-xl border border-zinc-100" style={{ backgroundColor: `${primaryColor}10` }}>
                <span className="text-sm font-black" style={{ color: primaryColor }}>${totalEstimatedCost.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-zinc-500">Cerrar</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 text-sm font-black text-white rounded-xl shadow-lg disabled:opacity-70"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
