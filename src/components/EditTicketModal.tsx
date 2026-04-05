import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Mechanic, Part, ServiceItem, InspeccionDetalle, InspectionStatus, INICIAL_CHECKLIST_ITEMS, ChecklistIngreso, INICIAL_INGRESO_CHECKLIST } from '../types';
import { X, Save, User, FileText, Loader2, Trash2, PlusCircle, Camera, ImagePlus, History, Search, Package, Send, ShieldCheck, AlertCircle, ChevronDown, ClipboardList, PenTool, ChevronRight } from 'lucide-react';
import { VehicleHistoryView } from './VehicleHistoryView';
import { InspeccionModal } from './InspeccionModal';
import { cn } from '../lib/utils';

interface EditTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket | null;
    tickets: Ticket[]; // Added for history view
    mechanics: Mechanic[];
    parts: Part[];
    onUpdate: (id: string, updates: Partial<Ticket>) => Promise<void>;
    onUploadPhoto: (patente: string, file: File) => Promise<string>;
    onUpdatePart?: (id: string, updates: Partial<Part>) => Promise<void>;
    settings?: any;
}

export function EditTicketModal({ isOpen, onClose, ticket, tickets, mechanics, parts, onUpdate, onUploadPhoto, onUpdatePart, settings }: EditTicketModalProps) {
    const [notes, setNotes] = useState('');
    const [mechanicId, setMechanicId] = useState('Sin asignar');
    const [quotationTotal, setQuotationTotal] = useState<number>(0);
    const [mileage, setMileage] = useState<number>(0);
    const [jobPhotos, setJobPhotos] = useState<string[]>([]);
    const [spareParts, setSpareParts] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Tarjeta' | 'Efectivo' | 'Transferencia'>('Tarjeta');
    const [rutEmpresa, setRutEmpresa] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [transferData, setTransferData] = useState('');
    const [inspeccion, setInspeccion] = useState<InspeccionDetalle | null>(null);
    const [checklistIngreso, setChecklistIngreso] = useState<ChecklistIngreso | null>(null);
    const [showInspectionModal, setShowInspectionModal] = useState(false);
    const [ownerName, setOwnerName] = useState('');
    const [ownerPhone, setOwnerPhone] = useState('');
    const [vehicleNotes, setVehicleNotes] = useState('');
    // Search state for spare parts
    const [partSearch, setPartSearch] = useState('');
    const [showPartDropdown, setShowPartDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Track which part_ids were already used when the ticket was opened
    const originalPartIds = useRef<string[]>([]);

    useEffect(() => {
        if (ticket) {
            setNotes(ticket.notes || '');
            setMechanicId(ticket.mechanic_id || 'Sin asignar');
            setQuotationTotal(ticket.quotation_total || 0);
            setMileage(ticket.mileage || 0);
            setJobPhotos(ticket.job_photos || []);
            const savedParts = ticket.spare_parts || [];
            const savedServices = ticket.services || [];
            // Fusionar servicios anteriores con repuestos en una sola lista
            const combined = [
                ...savedServices.filter(s => s.descripcion || s.costo),
                ...savedParts
            ];
            setSpareParts(combined.length > 0 ? combined : []);
            originalPartIds.current = [
                ...savedParts.filter(p => p.part_id).map(p => p.part_id!),
                ...savedServices.filter(s => s.part_id).map(s => s.part_id!)
            ];
            setPaymentMethod(ticket.payment_method || 'Tarjeta');
            setRutEmpresa(ticket.rut_empresa || '');
            setRazonSocial(ticket.razon_social || '');
            setTransferData(ticket.transfer_data || '');
            
            if (ticket.inspeccion) {
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

            setOwnerName(ticket.owner_name || '');
            setOwnerPhone(ticket.owner_phone || '');
            setVehicleNotes(ticket.vehicle_notes || '');
        }
    }, [ticket]);

    // Auto-calculate status_general based on severity
    useEffect(() => {
        if (!inspeccion) return;
        const statuses = inspeccion.checklist.map(i => i.status);
        let newStatus: InspectionStatus = 'gray';
        if (statuses.includes('red')) newStatus = 'red';
        else if (statuses.includes('yellow')) newStatus = 'yellow';
        else if (statuses.includes('green')) newStatus = 'green';
        else newStatus = 'gray';
        
        if (newStatus !== inspeccion.status_general) {
            setInspeccion(prev => prev ? { ...prev, status_general: newStatus } : null);
        }
    }, [inspeccion?.checklist]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowPartDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!isOpen || !ticket) return null;

    const isFinalized = ticket?.status === 'Finalizado' || ticket?.status === 'Entregado';

    // Spare parts (manual)
    const handleAddSparePart = () => setSpareParts([...spareParts, { descripcion: '', costo: 0, cantidad: 1 }]);
    const handleRemoveSparePart = (index: number) => setSpareParts(spareParts.filter((_, i) => i !== index));
    const handleSparePartChange = (index: number, field: keyof ServiceItem, value: string | number) => {
        const updated = [...spareParts];
        if (field === 'costo' || field === 'cantidad') {
            const numVal = Number(value);
            updated[index][field] = isNaN(numVal) ? 0 : numVal;
        } else if (field === 'descripcion') {
            updated[index].descripcion = value as string;
        }
        setSpareParts(updated);
    };

    // Inventory search
    const filteredInventory = parts.filter(p => {
        const search = partSearch.toLowerCase();
        if (!search) return false;
        return (
            p.name.toLowerCase().includes(search) ||
            p.id.toLowerCase().includes(search) ||
            p.price.toString().includes(search)
        ) && !spareParts.some(sp => sp.part_id === p.id); // don't show already-added parts
    });

    const handleSelectInventoryPart = (part: Part) => {
        const isLabor = part.name.toUpperCase().includes('SERVICIO') || 
                        part.name.toUpperCase().includes('M.O.') || 
                        part.name.toLowerCase().includes('mano de obra');
        
        const newItem = {
            descripcion: part.name,
            costo: part.price,
            cantidad: 1,
            part_id: part.id,
        };

        if (isLabor) {
            setSpareParts(prev => [...prev, newItem]);
        } else {
            setSpareParts(prev => [...prev, newItem]);
        }
        setPartSearch('');
        setShowPartDropdown(false);
    };

    // Cost calculation
    const totalInvestment = spareParts.reduce((acc, curr) => acc + (curr.costo || 0) * (curr.cantidad ?? 1), 0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !ticket) return;
        setUploading(true);
        try {
            const publicUrl = await onUploadPhoto(ticket.id, file);
            setJobPhotos(prev => [...prev, publicUrl]);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Error al subir la imagen. Por favor intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const toggleInspectionStatus = (id: string) => {
        if (!inspeccion) return;
        const item = inspeccion.checklist.find(i => i.id === id);
        if (!item) return;

        const cycle: InspectionStatus[] = ['gray', 'green', 'yellow', 'red'];
        const currentIndex = cycle.indexOf(item.status as InspectionStatus);
        const nextStatus = cycle[(currentIndex + 1) % cycle.length];

        const newChecklist = inspeccion.checklist.map(i => 
            i.id === id ? { ...i, status: nextStatus } : i
        );

        // Auto-calculate general status
        const statuses = newChecklist.map(i => i.status);
        let newGeneralStatus: InspectionStatus = 'gray';
        if (statuses.includes('red')) newGeneralStatus = 'red';
        else if (statuses.includes('yellow')) newGeneralStatus = 'yellow';
        else if (statuses.includes('green')) newGeneralStatus = 'green';
        else newGeneralStatus = 'gray';

        setInspeccion({
            ...inspeccion,
            checklist: newChecklist,
            status_general: newGeneralStatus
        });
    };

    const updateInspectionValue = (id: string, value: string) => {
        if (!inspeccion) return;
        setInspeccion({
            ...inspeccion,
            checklist: inspeccion.checklist.map(i => i.id === id ? { ...i, value } : i)
        });
    };

    const primaryColor = settings?.theme_button_color || '#f97316';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isFinalized) return;
        setLoading(true);
        try {
            await onUpdate(ticket!.id, {
                notes,
                owner_name: ownerName,
                owner_phone: ownerPhone,
                mechanic_id: mechanicId === 'Sin asignar' ? null : mechanicId,
                quotation_total: totalInvestment,
                cost: totalInvestment,
                mileage,
                job_photos: jobPhotos,
                services: [],
                spare_parts: spareParts,
                payment_method: paymentMethod,
                rut_empresa: rutEmpresa,
                razon_social: razonSocial,
                transfer_data: transferData,
                inspeccion: inspeccion ? {
                    ...inspeccion,
                    updated_at: new Date().toISOString()
                } : undefined,
                ingreso_checklist: checklistIngreso || undefined,
                status_general: inspeccion?.status_general || 'gray',
                vehicle_notes: vehicleNotes
            });

            // Deduct stock for newly-added inventory parts (both in parts and services)
            if (onUpdatePart) {
                for (const sp of spareParts) {
                    if (sp.part_id && !originalPartIds.current.includes(sp.part_id)) {
                        const isLabor = sp.descripcion.toUpperCase().includes('SERVICIO') || 
                                        sp.descripcion.toUpperCase().includes('M.O.') || 
                                        sp.descripcion.toLowerCase().includes('mano de obra');
                        
                        if (isLabor) continue; // Skip stock deduction for labor items

                        const inventoryPart = parts.find(p => p.id === sp.part_id);
                        const qty = sp.cantidad ?? 1;
                        if (inventoryPart && inventoryPart.stock > 0) {
                            await onUpdatePart(sp.part_id, { stock: Math.max(0, inventoryPart.stock - qty) });
                        }
                    }
                }
            }

            onClose();
        } catch (error) {
            console.error('Error updating ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-4 font-sans overflow-hidden">
            <div className={cn(
                "bg-white rounded-none md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-500 ease-out h-full md:max-h-[96vh] w-full",
                showHistory ? "max-w-6xl" : "max-w-3xl"
            )}>

                {/* Panel Principal de Edición */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-100">
                    {/* Header */}
                    <div className="flex justify-between items-start p-4 md:p-6 border-b border-zinc-50 shrink-0 bg-zinc-50/30">
                        <div className="flex flex-col">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] mb-1 px-3 py-1 rounded-full transition-all flex items-center gap-1.5 w-fit",
                                    showHistory ? "bg-purple-600 text-white shadow-lg" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                                )}
                            >
                                <History className={cn("w-3 h-3", showHistory && "animate-pulse")} />
                                {ticket.patente || ticket.id}
                                <span className={cn("font-medium lowercase", showHistory ? "text-purple-100" : "text-zinc-400")}>
                                    • {showHistory ? 'Cerrar Hoja de Vida' : 'Ver Hoja de Vida'}
                                </span>
                            </button>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight">
                                Editar {ticket.model} {ticket.owner_name ? ` - ${ticket.owner_name}` : ''}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-300 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5 items-start">
                            {/* Columna 1: Ficha Técnica e Inspección */}
                            <div className="space-y-6">
                                {/* Ficha Técnica */}
                                <div className="space-y-4 bg-zinc-50/30 p-5 rounded-3xl border border-zinc-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-6 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                                        <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Información del Servicio</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Nombre del Cliente</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-100 focus:border-blue-500 outline-none transition-all font-bold text-xs bg-white"
                                                value={ownerName}
                                                onChange={e => setOwnerName(e.target.value)}
                                                disabled={isFinalized}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Teléfono (WhatsApp)</label>
                                            <input
                                                type="tel"
                                                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-100 focus:border-blue-500 outline-none transition-all font-bold text-xs bg-white font-mono"
                                                value={ownerPhone}
                                                onChange={e => setOwnerPhone(e.target.value)}
                                                disabled={isFinalized}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Kilometraje</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-100 focus:border-blue-500 outline-none transition-all font-black text-sm pr-10 bg-white"
                                                    value={mileage || ''}
                                                    onChange={e => setMileage(Number(e.target.value))}
                                                    disabled={isFinalized}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-zinc-300">KM</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Próximo Cambio</label>
                                            <div className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-emerald-100 bg-emerald-50/30 flex items-center justify-between h-[42px]">
                                                <span className="text-sm font-black text-emerald-600">
                                                    {mileage > 0 ? (mileage + 10000).toLocaleString('es-CL') : '---'}
                                                </span>
                                                <span className="text-[7px] font-bold text-emerald-400 uppercase leading-none text-right">Sugerido<br/>+10K</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">Mecánico Encargado</label>
                                            <select
                                                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-100 focus:border-blue-500 outline-none transition-all bg-white text-zinc-900 font-bold text-xs uppercase tracking-wider"
                                                value={mechanicId}
                                                onChange={e => setMechanicId(e.target.value)}
                                                disabled={isFinalized}
                                            >
                                                <option value="Sin asignar">SIN ASIGNAR</option>
                                                {mechanics.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            
                                 {/* Diagnóstico y Notas Permanentes */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 rounded-full bg-amber-500"></div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Notas Permanentes del Vehículo</p>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                rows={2}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 focus:border-amber-500 outline-none transition-all resize-none text-zinc-800 text-xs disabled:bg-zinc-50 disabled:text-zinc-500 font-bold leading-relaxed bg-amber-50/10 shadow-sm"
                                                placeholder="Ej: El cliente es muy cuidadoso con la pintura, revisar frenos próxima visita..."
                                                value={vehicleNotes}
                                                onChange={e => setVehicleNotes(e.target.value)}
                                                disabled={isFinalized}
                                            />
                                            <PenTool className="absolute right-3 bottom-3 w-3.5 h-3.5 text-amber-200 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 rounded-full bg-blue-600"></div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Diagnóstico y Notas del Trabajo Actual</p>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 focus:border-blue-600 outline-none transition-all resize-none text-zinc-800 text-xs disabled:bg-zinc-50 disabled:text-zinc-500 font-medium leading-relaxed bg-white shadow-sm"
                                                placeholder="Ingrese el diagnóstico o notas adicionales del servicio..."
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                disabled={isFinalized}
                                            />
                                            <FileText className="absolute right-3 bottom-3 w-3.5 h-3.5 text-zinc-200 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-zinc-100 p-1 shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setShowInspectionModal(true)}
                                        className="w-full group flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                                inspeccion?.status_general ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-zinc-50 text-zinc-400 border border-zinc-100"
                                            )}>
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">Inspección de Vehículo</p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-0.5">Reporte de Recepción y Estado</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {inspeccion?.status_general && (
                                                <div className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                    inspeccion.status_general === 'green' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                    inspeccion.status_general === 'yellow' ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                    "bg-red-50 border-red-100 text-red-600"
                                                )}>
                                                    {inspeccion.status_general === 'green' ? 'SANO' : inspeccion.status_general === 'yellow' ? 'AVISO' : 'CRÍTICO'}
                                                </div>
                                            )}
                                            <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Columna 2: Servicios, Mecánico y Facturación */}
                            <div className="space-y-6">
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-zinc-50 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-4 rounded-full bg-blue-500"></div>
                                            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Desglose de Servicios</p>
                                        </div>
                                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Precios con IVA</span>
                                    </div>

                                    {/* Buscador de inventario */}
                                    {!isFinalized && (
                                        <div className="relative" ref={searchRef}>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar repuestos o servicios..."
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-zinc-100 hover:border-blue-200 focus:border-blue-500 outline-none transition-all text-sm bg-white font-medium"
                                                    value={partSearch}
                                                    onChange={e => { setPartSearch(e.target.value); setShowPartDropdown(true); }}
                                                    onFocus={() => setShowPartDropdown(true)}
                                                />
                                            </div>

                                            {showPartDropdown && partSearch.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl z-20 max-h-56 overflow-y-auto p-1">
                                                    {filteredInventory.length === 0 ? (
                                                        <div className="p-4 text-xs text-zinc-400 text-center italic">Sin resultados</div>
                                                    ) : (
                                                        filteredInventory.map(part => {
                                                            const isLabor = part.name.toUpperCase().includes('SERVICIO') || 
                                                                            part.name.toUpperCase().includes('M.O.') || 
                                                                            part.name.toLowerCase().includes('mano de obra');
                                                            const isOutOfStock = part.stock === 0 && !isLabor;
                                                            return (
                                                                <button
                                                                    key={part.id}
                                                                    type="button"
                                                                    disabled={isOutOfStock}
                                                                    onClick={() => handleSelectInventoryPart(part)}
                                                                    className={cn(
                                                                        "w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left rounded-xl mb-0.5 last:mb-0",
                                                                        isOutOfStock && "opacity-40 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Package className="w-4 h-4 text-blue-400 shrink-0" />
                                                                        <div>
                                                                            <span className="text-sm font-bold text-zinc-800 block">{part.name}</span>
                                                                            <span className="text-[9px] text-zinc-400 font-bold uppercase">STOCK: {isLabor ? '∞' : part.stock}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-xs font-black text-zinc-600">${part.price.toLocaleString('es-CL')}</span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {spareParts.length === 0 && !isFinalized && (
                                            <div className="text-center py-8 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Link de inventario pendiente</p>
                                            </div>
                                        )}
                                        {spareParts.map((part, index) => (
                                            <div key={index} className="flex gap-2 items-center bg-white p-1 rounded-xl">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Descripción"
                                                        className={cn(
                                                            "w-full px-3 py-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 focus:border-blue-500 outline-none transition-all text-[11px] font-bold bg-zinc-50/30",
                                                            part.part_id && "text-blue-600 border-blue-50 bg-blue-50/10"
                                                        )}
                                                        value={part.descripcion}
                                                        onChange={(e) => handleSparePartChange(index, 'descripcion', e.target.value)}
                                                        disabled={isFinalized || !!part.part_id}
                                                    />
                                                </div>
                                                <div className="w-14">
                                                    <input
                                                        type="number"
                                                        className="w-full px-2 py-2.5 rounded-lg border border-zinc-100 focus:border-blue-500 outline-none text-center text-[11px] font-black bg-zinc-50/30"
                                                        value={part.cantidad ?? ''}
                                                        onChange={(e) => handleSparePartChange(index, 'cantidad', e.target.value)}
                                                        disabled={isFinalized}
                                                    />
                                                </div>
                                                <div className="w-24 relative">
                                                    <input
                                                        type="number"
                                                        className="w-full pl-5 pr-2 py-2.5 rounded-lg border border-zinc-100 focus:border-blue-500 outline-none text-right text-[11px] font-black bg-zinc-50/30"
                                                        value={part.costo || ''}
                                                        onChange={(e) => handleSparePartChange(index, 'costo', e.target.value)}
                                                        disabled={isFinalized}
                                                    />
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-300">$</span>
                                                </div>
                                                {!isFinalized && (
                                                    <button type="button" onClick={() => handleRemoveSparePart(index)} className="p-2 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {!isFinalized && (
                                        <button type="button" onClick={handleAddSparePart} className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-blue-500 hover:bg-blue-50 py-3 rounded-2xl transition-all border border-blue-100 border-dashed uppercase tracking-widest">
                                            <PlusCircle className="w-4 h-4" />
                                            Agregar concepto manual
                                        </button>
                                    )}
                                </div>

                                {/* Facturación */}
                                <div className="space-y-3 pt-3 border-t border-zinc-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldCheck className="w-3 h-3 text-zinc-400" />
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Datos de Facturación</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-zinc-300 uppercase tracking-widest pl-1">RUT Empresa</label>
                                            <input
                                                type="text"
                                                placeholder="76.123.456-1"
                                                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-100 focus:border-blue-500 outline-none transition-all font-bold text-xs bg-white"
                                                value={rutEmpresa}
                                                onChange={e => setRutEmpresa(e.target.value)}
                                                disabled={isFinalized}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-zinc-300 uppercase tracking-widest pl-1">Razón Social</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Empresa SpA"
                                                className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-100 focus:border-blue-500 outline-none transition-all font-bold text-xs bg-white"
                                                value={razonSocial}
                                                onChange={e => setRazonSocial(e.target.value)}
                                                disabled={isFinalized}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Evidencia Fotográfica */}
                        <div className="space-y-5 pt-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <Camera className="w-4 h-4" />
                                    Evidencia del Trabajo
                                </label>
                                <span className="text-[10px] font-black text-zinc-300 tabular-nums">{jobPhotos.length}/6 FOTOS</span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {jobPhotos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-50 group/photo shadow-sm hover:shadow-md transition-shadow">
                                        <img src={photo} alt={`Trabajo ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setJobPhotos(prev => prev.filter((_, i) => i !== index))}
                                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                            disabled={isFinalized}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {uploading && (
                                    <div className="aspect-square rounded-xl border-2 border-zinc-100 bg-zinc-50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                    </div>
                                )}

                                {jobPhotos.length < 6 && !isFinalized && !uploading && (
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-emerald-600 group">
                                        <ImagePlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">SUBIR</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-6 border-t border-zinc-100 sticky bottom-0 bg-white pb-6 mt-8 -mx-6 md:-mx-8 px-6 md:px-8 space-y-4 -mb-6 md:-mb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between gap-4">
                                {/* Visualizador de Total */}
                                <div className="bg-zinc-900 px-6 py-3.5 rounded-2xl flex items-center gap-6 shadow-xl shadow-zinc-200 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] relative z-10 leading-none mb-1">Total Estimado</span>
                                        <span className="text-xl font-black text-white relative z-10 tabular-nums">
                                            ${totalInvestment.toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-4 text-[10px] font-black text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-2xl transition-all uppercase tracking-widest"
                                    >
                                        Descartar
                                    </button>
                                    {!isFinalized && (
                                        <button
                                            type="submit"
                                            disabled={loading || uploading}
                                            className="flex items-center justify-center gap-3 px-10 py-4 text-[10px] font-black text-white bg-zinc-900 border border-zinc-900 hover:bg-black rounded-2xl transition-all shadow-xl shadow-zinc-200 uppercase tracking-[0.2em] disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {loading ? 'Sincronizando...' : 'Guardar Servicio'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Panel de Historia (Side Panel) */}
                <div className={cn(
                    "flex flex-col bg-zinc-50 transition-all duration-500 ease-out border-l border-zinc-100 overflow-hidden",
                    showHistory ? "w-full md:w-[450px] opacity-100" : "w-0 opacity-0"
                )}>
                    {showHistory && (
                        <div className="flex-1 flex flex-col p-4 md:p-6 h-full overflow-hidden animate-in slide-in-from-right-10 duration-500">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                                    <History className="w-4 h-4 text-purple-600" />
                                    HOJA DE VIDA
                                </h3>
                                <button onClick={() => setShowHistory(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 min-h-0">
                                <VehicleHistoryView ticket={ticket} allTickets={tickets} settings={settings} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales de Recepción e Inspección */}
            {ticket && (
                <>
                    <InspeccionModal
                        isOpen={showInspectionModal}
                        onClose={() => setShowInspectionModal(false)}
                        ticket={{
                            ...ticket,
                            inspeccion: inspeccion || ticket.inspeccion,
                            ingreso_checklist: checklistIngreso || ticket.ingreso_checklist
                        }}
                        onUpdate={async (id, updates) => {
                            if (updates.inspeccion) {
                                setInspeccion(updates.inspeccion as InspeccionDetalle);
                            }
                            if (updates.ingreso_checklist) {
                                setChecklistIngreso(updates.ingreso_checklist as ChecklistIngreso);
                            }
                            // Save to database via the onUpdate prop passed from the parent of EditTicketModal
                            if (onUpdate) {
                                await onUpdate(id, updates);
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
}
