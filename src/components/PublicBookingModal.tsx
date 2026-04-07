import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, ArrowRight, ArrowLeft, CheckCircle, LocateFixed, Loader2, Phone, Building2, Search, MapPin, ShieldCheck, Sparkles, History, Smartphone } from 'lucide-react';
import { format, parseISO, addDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import logoVespucio from '@/assets/logo_vespucio.png';

interface PublicBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    fetchCompanies: () => Promise<{ id: string, name: string }[]>;
    onAddReminder: (reminder: any) => Promise<void>;
    fetchOccupied?: (companyId: string, date: string) => Promise<string[]>;
    fetchVehicleInfo?: (company_id: string, identificador: string) => Promise<any>;
    branding?: any;
}

const DEFAULT_TIME_SLOTS = [
    '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00'
];

export function PublicBookingModal({ isOpen, onClose, fetchCompanies, onAddReminder, fetchOccupied, fetchVehicleInfo, branding }: PublicBookingModalProps) {
    const [step, setStep] = useState(1);
    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [lookupValue, setLookupValue] = useState('');
    const [success, setSuccess] = useState(false);
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
    
    const [formData, setFormData] = useState({
        company_id: '',
        company_name: '',
        planned_date: format(new Date(), 'yyyy-MM-dd'),
        planned_time: '',
        customer_name: '',
        customer_phone: '',
        vehicle_id: '', // Patente
        vehicle_model: '',
        notes: ''
    });

    // Helper para obtener slots según el día de la semana
    const getSlotsForDate = (dateString: string) => {
        const date = parseISO(dateString);
        const day = date.getDay(); // 0 = Domingo, 6 = Sábado
        const isWeekend = day === 0 || day === 6;

        // 1. Intentar obtener desde landing_config (preferencia del usuario)
        const lc = branding?.landing_config;
        if (lc) {
            const slots = isWeekend ? lc.agenda_slots_weekends : lc.agenda_slots_weekdays;
            if (Array.isArray(slots) && slots.length > 0) return slots;
        }

        // 2. Fallback a agenda_slots tradicional
        if (branding?.agenda_slots) {
            if (Array.isArray(branding.agenda_slots)) {
                return branding.agenda_slots.length > 0 ? branding.agenda_slots : DEFAULT_TIME_SLOTS;
            }
            
            let targetSlots: string[] | undefined;
            if (day === 6) { // Sábado
                targetSlots = branding.agenda_slots.saturdays || branding.agenda_slots.weekends;
            } else if (day === 0) { // Domingo
                targetSlots = branding.agenda_slots.sundays || branding.agenda_slots.weekends;
            } else { // Lunes a Viernes
                targetSlots = branding.agenda_slots.weekdays;
            }
            if (targetSlots && targetSlots.length > 0) return targetSlots;
        }
        
        return DEFAULT_TIME_SLOTS;
    };

    const slots = getSlotsForDate(formData.planned_date);
    const allowedDays = branding?.agenda_days && branding.agenda_days.length > 0 ? branding.agenda_days : [1, 2, 3, 4, 5, 6]; 

    // Branding Colors
    const primaryColor = branding?.theme_primary_color || '#f97316';
    const primaryBg = `${primaryColor}20`; // 12% opacity roughly

    useEffect(() => {
        if (isOpen) {
            handleReset();
            setLoading(true);
            fetchCompanies().then(data => {
                const filtered = data.filter(c => 
                    c.name.toLowerCase().includes('lubri') || 
                    c.name.toLowerCase().includes('vespucio') ||
                    c.name.includes('CIAL')
                );
                setCompanies(filtered);
                
                const target = filtered.find(c => c.name.toLowerCase().includes('lubri')) || filtered[0] || data[0];
                
                if (target) {
                    setFormData(prev => ({ ...prev, company_id: target.id, company_name: target.name }));
                    setStep(2); 
                }
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const patente = formData.vehicle_id.replace(/[\s\.\-·]/g, '');
        if (patente.length < 6 || !fetchVehicleInfo || !formData.company_id) return;

        const timer = setTimeout(() => {
            fetchVehicleInfo(formData.company_id, patente).then(info => {
                if (info) {
                    setFormData(prev => ({
                        ...prev,
                        customer_name: prev.customer_name || info.owner_name || '',
                        customer_phone: prev.customer_phone || info.owner_phone || '',
                        vehicle_model: prev.vehicle_model || info.model || ''
                    }));
                }
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.vehicle_id, formData.company_id, fetchVehicleInfo]);

    useEffect(() => {
        if (formData.company_id && formData.planned_date && fetchOccupied) {
            fetchOccupied(formData.company_id, formData.planned_date).then(slots => {
                setOccupiedSlots(slots);
            });
        }
    }, [formData.company_id, formData.planned_date, fetchOccupied]);

    const handleQuickLookup = async () => {
        if (!lookupValue || lookupValue.length < 4) return;
        
        setSearching(true);
        try {
            const data = await fetchVehicleInfo!(formData.company_id, lookupValue);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    vehicle_id: data.vehicle_id || prev.vehicle_id,
                    customer_name: data.owner_name || prev.customer_name,
                    customer_phone: data.owner_phone || prev.customer_phone,
                    vehicle_model: data.model || prev.vehicle_model
                }));
            } else {
                alert('No encontramos datos previos asociados. Por favor completa el formulario manualmente.');
            }
        } catch (err) {
            console.error('Lookup error:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSuccess(false);
        setLookupValue('');
        setOccupiedSlots([]);
        setFormData({
            company_id: '',
            company_name: '',
            planned_date: format(new Date(), 'yyyy-MM-dd'),
            planned_time: '',
            customer_name: '',
            customer_phone: '',
            vehicle_id: '',
            vehicle_model: '',
            notes: ''
        });
    };

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onAddReminder({
                company_id: formData.company_id,
                customer_name: formData.customer_name,
                customer_phone: formData.customer_phone,
                patente: formData.vehicle_id,
                vehicle_model: formData.vehicle_model,
                planned_date: formData.planned_date,
                planned_time: formData.planned_time,
                reminder_type: 'Cita Web',
                completed: false
            });
            setSuccess(true);
        } catch (err: any) {
            console.error('Booking error:', err);
            alert(`Error al agendar: ${err.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
                {success ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        key="success"
                        className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorative background flare */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/10 blur-[100px] pointer-events-none" />
                        
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl" 
                            style={{ backgroundColor: primaryBg }}
                        >
                            <CheckCircle className="w-12 h-12" style={{ color: primaryColor }} />
                        </motion.div>
                        
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">¡Cita Confirmada!</h2>
                        <div className="space-y-4 mb-10">
                            <p className="text-zinc-400 leading-relaxed text-sm px-4">
                                Hemos registrado tu visita para el día <span className="text-white font-bold">{format(parseISO(formData.planned_date), "dd 'de' MMMM", { locale: es })}</span> a las <span className="text-white font-bold">{formData.planned_time} hrs</span>.
                            </p>
                            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5 inline-block">
                                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Taller Seleccionado</p>
                                <p className="text-white font-bold">{formData.company_name}</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-[1.5rem] font-black transition-all active:scale-95 shadow-xl border border-white/5 uppercase tracking-widest text-xs"
                        >
                            Volver al Inicio
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        key="form"
                        className="bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden relative"
                    >
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 px-1 pt-1 opacity-50">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex-1 h-full rounded-full transition-all duration-500" style={{ backgroundColor: step >= i ? primaryColor : 'rgba(255,255,255,0.05)' }} />
                            ))}
                        </div>

                        {/* Header */}
                        <div className="p-8 pt-10 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                                    {step === 1 && "Selecciona Taller"}
                                    {step === 2 && "Fecha y Hora"}
                                    {step === 3 && "Tus Datos"}
                                    <Sparkles className="w-5 h-5 text-orange-400" />
                                </h2>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                    Paso {step} de 3 — Agenda rápida en 60 segundos
                                </p>
                            </div>
                            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-zinc-900 rounded-2xl transition-all text-zinc-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {/* STEP 1: Selección de Empresa */}
                                {step === 1 && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        key="step1"
                                        className="space-y-6"
                                    >
                                        <div className="text-center p-8 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 mb-6 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center p-4 border border-white/10 shadow-2xl mx-auto mb-6 relative z-10 transition-transform group-hover:scale-105">
                                                <img src={logoVespucio} alt="Lubrivespucio" className="w-full h-full object-contain" />
                                            </div>
                                            <h3 className="text-2xl font-black text-white tracking-tighter relative z-10">LUBRIVESPUCIO</h3>
                                            <p className="text-xs text-zinc-400 mt-2 flex items-center justify-center gap-1 font-medium relative z-10">
                                                <MapPin className="w-3.5 h-3.5 text-orange-500" /> Av. Américo Vespucio 310, Maipú
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {companies.map(company => (
                                                <button
                                                    key={company.id}
                                                    onClick={() => {
                                                        setFormData({ ...formData, company_id: company.id, company_name: company.name });
                                                        handleNext();
                                                    }}
                                                    className={cn(
                                                        "w-full p-6 rounded-[1.5rem] border-2 text-left transition-all active:scale-[0.98] flex items-center justify-between group",
                                                        formData.company_id === company.id ? "bg-zinc-800 border-orange-500" : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/[0.07]"
                                                    )}
                                                >
                                                    <div>
                                                        <span className="font-black text-white text-lg tracking-tight block group-hover:translate-x-1 transition-transform">{company.name}</span>
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 block italic">Sucursal Principal</span>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: Fecha y Hora */}
                                {step === 2 && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        key="step2"
                                        className="space-y-8"
                                    >
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                                <Calendar className="w-3.5 h-3.5 text-orange-500" /> 1. ELIGE EL DÍA DE TU PREFERENCIA
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="date"
                                                    min={format(new Date(), 'yyyy-MM-dd')}
                                                    className="w-full p-6 rounded-[1.5rem] border-2 border-white/5 bg-zinc-900 text-white outline-none focus:border-orange-500 transition-all font-black text-lg appearance-none shadow-xl"
                                                    value={formData.planned_date}
                                                    onChange={e => {
                                                        const date = new Date(e.target.value + 'T12:00:00');
                                                        const dayOfWeek = date.getDay();
                                                        if (!allowedDays.includes(dayOfWeek)) {
                                                            alert('El taller se encuentra cerrado este día. Por favor selecciona una fecha de Lunes a Sábado.');
                                                            return;
                                                        }
                                                        setFormData({ ...formData, planned_date: e.target.value, planned_time: '' });
                                                    }}
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                    {isToday(parseISO(formData.planned_date)) && <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg uppercase">Hoy</span>}
                                                    {isTomorrow(parseISO(formData.planned_date)) && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase">Mañana</span>}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-bold italic px-2">
                                                * Atendemos de {allowedDays.map((d: number) => ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][d]).slice(0, 1) === 'Lun' ? 'Lunes' : '...'} a {allowedDays.includes(6) ? 'Sábado' : 'Viernes'}.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                                <Clock className="w-3.5 h-3.5 text-orange-500" /> 2. SELECCIONA EL BLOQUE HORARIO
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {slots.map(slot => {
                                                    const isOccupied = occupiedSlots.includes(slot);
                                                    const isSelected = formData.planned_time === slot;
                                                    
                                                    return (
                                                        <button
                                                            key={slot}
                                                            disabled={isOccupied}
                                                            onClick={() => setFormData({ ...formData, planned_time: slot })}
                                                            className={cn(
                                                                "py-4 rounded-2xl font-black text-sm transition-all border-2 relative overflow-hidden group/slot",
                                                                isOccupied ? "bg-zinc-900 border-transparent text-zinc-700 cursor-not-allowed" :
                                                                isSelected ? "bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-600/20 scale-105" : 
                                                                "bg-white/5 border-white/5 text-zinc-300 hover:border-white/10 hover:bg-white/10"
                                                            )}
                                                        >
                                                            {slot}
                                                            {isOccupied && <span className="absolute inset-0 flex items-center justify-center text-[8px] uppercase tracking-tighter opacity-30 rotate-12">Ocupado</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="pt-6 flex gap-4">
                                            <button onClick={handleBack} className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-[1.5rem] font-black hover:bg-zinc-800 transition-all uppercase tracking-widest text-[10px] border border-white/5">
                                                Atrás
                                            </button>
                                            <button 
                                                onClick={handleNext}
                                                disabled={!formData.planned_date || !formData.planned_time}
                                                className="flex-[2] py-5 bg-orange-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-orange-600/30 transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs"
                                            >
                                                Siguiente <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: Datos de contacto */}
                                {step === 3 && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        key="step3"
                                        className="space-y-6"
                                    >
                                        {/* Helper / Quick Lookup Card */}
                                        <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:bg-orange-500/20 transition-all">
                                                    <Sparkles className="w-6 h-6 text-orange-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-black text-sm tracking-tight mb-1 uppercase">¿Ya eres cliente?</h4>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-4 leading-relaxed">
                                                        Usa el autocompletado rápido para ahorrar tiempo ingresando solo tu patente.
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                                            <input
                                                                type="text"
                                                                placeholder="Patente (Ej: ABCD-12)"
                                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 text-white outline-none focus:border-orange-500 transition-all text-sm font-black tracking-widest placeholder:text-zinc-800 uppercase"
                                                                value={lookupValue}
                                                                onChange={e => setLookupValue(e.target.value.toUpperCase())}
                                                                onKeyDown={e => e.key === 'Enter' && handleQuickLookup()}
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={handleQuickLookup}
                                                            disabled={searching || lookupValue.length < 4}
                                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 border border-white/5"
                                                        >
                                                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sincronizar'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-5 px-1">
                                            {/* Vehículo - Dos columnas */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                                                        <Car className="w-3.5 h-3.5 text-orange-500" /> Patente de tu auto
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ejemplo: BB CC 88"
                                                        className="w-full px-5 py-4 rounded-2xl bg-zinc-900 border border-white/5 text-white font-black uppercase focus:border-orange-500 outline-none transition-all placeholder:text-zinc-800 shadow-inner"
                                                        value={formData.vehicle_id}
                                                        onChange={e => setFormData({ ...formData, vehicle_id: e.target.value.toUpperCase() })}
                                                    />
                                                    <p className="text-[9px] text-zinc-600 font-bold ml-1 uppercase italic">* Sin puntos ni guiones</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                                                        <LocateFixed className="w-3.5 h-3.5 text-orange-500" /> Marca y Modelo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej: Mazda CX-5 2019"
                                                        className="w-full px-5 py-4 rounded-2xl bg-zinc-900 border border-white/5 text-white font-bold focus:border-orange-500 outline-none transition-all placeholder:text-zinc-800 shadow-inner"
                                                        value={formData.vehicle_model}
                                                        onChange={e => setFormData({ ...formData, vehicle_model: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Dueño */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-orange-500" /> ¿Cuál es tu nombre completo?
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Escribe aquí tu nombre y apellido"
                                                    className="w-full px-6 py-4 rounded-2xl bg-zinc-900 border border-white/5 text-white font-bold focus:border-orange-500 outline-none transition-all placeholder:text-zinc-800 shadow-inner"
                                                    value={formData.customer_name}
                                                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                                />
                                            </div>

                                            {/* WhatsApp */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                                                    <Smartphone className="w-3.5 h-3.5 text-orange-500" /> Celular o WhatsApp
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="tel"
                                                        placeholder="Ej: +56 9 8765 4321"
                                                        className="w-full px-6 py-4 rounded-2xl bg-zinc-900 border border-white/5 text-white font-bold focus:border-orange-500 outline-none transition-all placeholder:text-zinc-800 shadow-inner"
                                                        value={formData.customer_phone}
                                                        onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                                                    />
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 py-1 px-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">En línea</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 flex gap-4">
                                            <button 
                                                onClick={handleBack} 
                                                disabled={loading}
                                                className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-[1.5rem] font-black hover:bg-zinc-800 hover:text-white transition-all uppercase tracking-widest text-[10px] border border-white/5 flex items-center justify-center gap-2"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5" /> Volver
                                            </button>
                                            <button 
                                                onClick={handleSubmit}
                                                disabled={loading || !formData.customer_name || !formData.vehicle_id}
                                                className="flex-[2] py-5 bg-orange-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-orange-600/30 transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs"
                                                style={{ backgroundColor: loading ? undefined : primaryColor }}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Agendando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="w-5 h-5" />
                                                        <span>CONFIRMAR MI CITA</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
