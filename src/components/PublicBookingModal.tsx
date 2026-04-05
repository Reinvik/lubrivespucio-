import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Car, ArrowRight, ArrowLeft, CheckCircle, LocateFixed, Loader2, Phone, Building2, Search, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CAR_BRANDS, CAR_MODELS } from '../lib/carData';
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

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
];

export function PublicBookingModal({ isOpen, onClose, fetchCompanies, onAddReminder, fetchOccupied, fetchVehicleInfo, branding }: PublicBookingModalProps) {
    const [step, setStep] = useState(1);
    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [lookupValue, setLookupValue] = useState('');
    const [success, setSuccess] = useState(false);
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
    const [brandSearch, setBrandSearch] = useState('');
    
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

    // Branding Colors - Matching Landing Page
    const primaryColor = '#f97316'; // Orange-500
    const primaryBg = `rgba(249, 115, 22, 0.15)`;

    useEffect(() => {
        if (isOpen) {
            handleReset();
            setLoading(true);
            fetchCompanies().then(data => {
                // Filtrar para Lubrivespucio / CIAL
                const filtered = data.filter(c => 
                    c.name.toLowerCase().includes('lubri') || 
                    c.name.toLowerCase().includes('vespucio') ||
                    c.name.includes('CIAL')
                );
                setCompanies(filtered);
                
                const target = filtered.find(c => c.name.toLowerCase().includes('lubri')) || filtered[0] || data[0];
                
                if (target) {
                    setFormData(prev => ({ ...prev, company_id: target.id, company_name: target.name }));
                    setStep(2); // Saltar directo a la fecha si solo hay uno relevante
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

    const handleQuickLookup = async (manualValue?: string) => {
        const val = manualValue || lookupValue;
        if (!val || val.length < 4) return;
        
        setSearching(true);
        try {
            const data = await fetchVehicleInfo!(formData.company_id, val);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    vehicle_id: data.vehicle_id || prev.vehicle_id,
                    customer_name: data.owner_name || prev.customer_name,
                    customer_phone: data.owner_phone || prev.customer_phone,
                    vehicle_model: data.model || prev.vehicle_model
                }));
            } else if (manualValue === undefined) {
                // Solo alertar si fue una búsqueda manual
                alert('No se encontraron datos previos. Por favor completa manualmente.');
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

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primaryBg }}>
                        <CheckCircle className="w-10 h-10" style={{ color: primaryColor }} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">¡Cita Agendada!</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Tu visita a <strong>{formData.company_name}</strong> ha sido registrada exitosamente.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all active:scale-95"
                        >
                            LISTO
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/30">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Agendar Visita</h2>
                        <div className="flex gap-2 mt-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={cn("h-1.5 w-10 rounded-full transition-all", step >= i ? "" : "bg-zinc-800")} style={{ backgroundColor: step >= i ? primaryColor : undefined }} />
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-zinc-900 rounded-2xl transition-all text-zinc-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* STEP 1: Selección de Empresa */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center p-6 bg-zinc-900/50 rounded-[2rem] border border-zinc-800 mb-6">
                                <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center p-4 border border-zinc-800 shadow-xl mx-auto mb-4">
                                    <img src={logoVespucio} alt="Lubrivespucio" className="w-full h-full object-contain" />
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight">LUBRIVESPUCIO</h3>
                                <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
                                    <MapPin className="w-3 h-3 text-orange-500" /> Av. Américo Vespucio 310, Maipú
                                </p>
                            </div>

                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4">SELECCIONA EL TALLER</label>
                            <div className="grid gap-3">
                                {companies.map(company => (
                                    <button
                                        key={company.id}
                                        onClick={() => {
                                            setFormData({ ...formData, company_id: company.id, company_name: company.name });
                                            handleNext();
                                        }}
                                        className={cn(
                                            "w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98]",
                                            formData.company_id === company.id ? "bg-zinc-900 border-orange-500 shadow-xl" : "border-zinc-900 bg-zinc-900/30 hover:border-zinc-700"
                                        )}
                                    >
                                        <span className="font-extrabold text-white text-lg">{company.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Fecha y Hora */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-orange-500" /> FECHA DE VISITA
                                </label>
                                <input
                                    type="date"
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full p-5 rounded-2xl border-2 border-zinc-800 bg-zinc-900 text-white outline-none focus:border-orange-500 transition-all font-bold"
                                    value={formData.planned_date}
                                    onChange={e => setFormData({ ...formData, planned_date: e.target.value, planned_time: '' })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-500" /> HORARIOS DISPONIBLES
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {TIME_SLOTS.map(slot => {
                                        const isOccupied = occupiedSlots.includes(slot);
                                        const isSelected = formData.planned_time === slot;
                                        
                                        return (
                                            <button
                                                key={slot}
                                                disabled={isOccupied}
                                                onClick={() => setFormData({ ...formData, planned_time: slot })}
                                                className={cn(
                                                    "py-3 rounded-xl font-bold text-sm transition-all border-2",
                                                    isOccupied ? "bg-zinc-900/20 border-zinc-900 text-zinc-700 cursor-not-allowed" :
                                                    isSelected ? "bg-orange-600 border-orange-600 text-white shadow-lg scale-105" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                                                )}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                                    Atrás
                                </button>
                                <button 
                                    onClick={handleNext}
                                    disabled={!formData.planned_date || !formData.planned_time}
                                    className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 active:scale-95"
                                >
                                    CONTINUAR <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Datos de contacto */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Patente o Teléfono..."
                                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white outline-none focus:border-orange-500 transition-all text-sm font-bold"
                                        value={lookupValue}
                                        onChange={e => setLookupValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleQuickLookup()}
                                    />
                                    <button 
                                        onClick={() => handleQuickLookup()}
                                        disabled={searching || lookupValue.length < 4}
                                        className="px-4 py-3 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all"
                                    >
                                        {searching ? '...' : 'BUSCAR'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-500">Patente</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-black uppercase focus:border-orange-500 outline-none"
                                        value={formData.vehicle_id}
                                        onChange={e => setFormData({ ...formData, vehicle_id: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-500">Modelo</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold focus:border-orange-500 outline-none"
                                        value={formData.vehicle_model}
                                        onChange={e => setFormData({ ...formData, vehicle_model: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-500">Nombre Completo</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold focus:border-orange-500 outline-none"
                                    value={formData.customer_name}
                                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-500">WhatsApp</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold focus:border-orange-500 outline-none"
                                    value={formData.customer_phone}
                                    onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                                />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button onClick={handleBack} className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                                    Atrás
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.customer_name || !formData.vehicle_id}
                                    className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                                    CONFIRMAR CITA
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
