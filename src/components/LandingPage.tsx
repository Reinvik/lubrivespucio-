import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Menu,
  X,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Info,
  Scan,
  Droplet,
  Settings,
  ShieldCheck,
  Wind,
  Cpu,
  Calendar,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Phone,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoVespucio from '../assets/logo_vespucio.png';
import mapVespucio from '../assets/map_vespucio.png';
import { LUBRIgarage_SERVICES } from '../data/services';
import { LubriService } from '../types';

const ServiceDetailModal = ({ 
  service, 
  isOpen, 
  onClose, 
  onBook 
}: { 
  service: LubriService | null, 
  isOpen: boolean, 
  onClose: () => void,
  onBook: () => void
}) => {
  if (!service) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Image Section */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
              <img 
                src={service.image} 
                alt={service.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:bg-gradient-to-r" />
              
              <button 
                onClick={onClose}
                className="absolute top-8 left-8 p-3 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-all md:hidden"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                      {service.icon === 'Droplet' && <Droplet className="w-6 h-6" />}
                      {service.icon === 'Settings' && <Settings className="w-6 h-6" />}
                      {service.icon === 'ShieldCheck' && <ShieldCheck className="w-6 h-6" />}
                      {service.icon === 'Scan' && <Scan className="w-6 h-6" />}
                      {service.icon === 'Clock' && <Clock className="w-6 h-6" />}
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">{service.category}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black italic tracking-tight">{service.title}</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="hidden md:block p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-12">
                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Detalles del Servicio
                  </h3>
                  <p className="text-lg text-slate-400 font-medium leading-relaxed">
                    {service.details || service.description}
                  </p>
                </div>

                {service.pricingTiers && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Tarifario Referencial</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {service.pricingTiers.map((tier, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-orange-500/20 transition-all group">
                          <span className="font-black text-slate-300 group-hover:text-white transition-colors">{tier.label}</span>
                          <span className="font-black text-orange-500">${tier.price.toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 space-y-6">
                  <p className="text-sm font-bold text-slate-500 italic">
                    {service.footerNote}
                  </p>
                  
                  <button 
                    onClick={() => {
                      onClose();
                      onBook();
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest py-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-500/20"
                  >
                    <Calendar className="w-5 h-5" />
                    Agendar este servicio
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface LandingPageProps {
  onPortalAccess: () => void;
  onAdminAccess: () => void;
  onCustomerSearch: (patente: string) => Promise<void>;
  onOpenBooking: () => void;
  fetchCompanies: () => Promise<any[]>;
  onAddReminder: (reminder: any) => Promise<void>;
  fetchOccupied: (companyId: string, date: string) => Promise<string[]>;
  fetchVehicleInfo: (company_id: string, identificador: string) => Promise<any>;
  branding?: any;
  onLogin?: (email: string, pass: string) => Promise<{ error: any }>;
}

const AdminLoginModal = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  isLoggingIn, 
  loginError,
  email,
  setEmail,
  pass,
  setPass 
}: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-gradient-to-br from-[#121829]/80 to-[#0d121f]/95 border border-white/10 rounded-[48px] p-8 md:p-14 shadow-[0_0_80px_rgba(249,115,22,0.1)] overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[100px] -z-10 animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">Acceso Admin</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Sistema Operativo</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onLogin(e); }} className="space-y-8">
              <div className="space-y-5">
                <div className="group relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 group-focus-within:text-orange-500 transition-colors">Usuario Autorizado</label>
                  <div className="absolute left-5 bottom-4.5 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    type="email" 
                    placeholder="email@lubrivespucio.cl"
                    required
                    autoFocus
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-3xl focus:border-orange-500/50 transition-all outline-none font-bold placeholder:text-slate-700 focus:bg-white/[0.08] focus:ring-4 focus:ring-orange-500/5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="group relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 group-focus-within:text-orange-500 transition-colors">Clave de Seguridad</label>
                  <div className="absolute left-5 bottom-4.5 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    required
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-3xl focus:border-orange-500/50 transition-all outline-none font-bold placeholder:text-slate-700 focus:bg-white/[0.08] focus:ring-4 focus:ring-orange-500/5"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                  />
                </div>
              </div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-red-400 text-[11px] font-bold uppercase tracking-wider">{loginError}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="group relative w-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-4 bg-orange-500 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-orange-500/30">
                  {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                  {isLoggingIn ? 'Autenticando...' : 'Iniciar Sesión'}
                </div>
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
               <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                 <Cpu className="w-3.5 h-3.5 text-slate-500" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Punto de acceso encriptado</span>
               </div>
               <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest text-center leading-loose max-w-[300px]">
                 Este sistema es de uso restringido.<br/>Si no tiene credenciales, contacte al administrador.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const LandingPage = ({ 
  onPortalAccess, 
  onAdminAccess, 
  onCustomerSearch, 
  onOpenBooking,
  onLogin,
  branding 
}: LandingPageProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<LubriService | null>(null);
  const [patenteSearch, setPatenteSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const dynamicServices = useMemo(() => {
    if (!branding?.pricing) return LUBRIgarage_SERVICES;

    return LUBRIgarage_SERVICES.map(service => {
      const newService = { ...service };
      const p = branding.pricing;

      if (service.id === 'cambio-aceite-basico' && p.oil_simple) {
        newService.pricingTiers = service.pricingTiers?.map(tier => ({
          ...tier,
          price: p.oil_simple[tier.label] || tier.price
        }));
        const minPrice = Math.min(...(newService.pricingTiers?.map(t => t.price) || [29000]));
        newService.price = `Desde $${minPrice.toLocaleString('es-CL')}`;
      } else if (service.id === 'cambio-aceite-completo' && p.oil_full) {
        newService.pricingTiers = service.pricingTiers?.map(tier => ({
          ...tier,
          price: p.oil_full[tier.label] || tier.price
        }));
        const minPrice = Math.min(...(newService.pricingTiers?.map(t => t.price) || [49000]));
        newService.price = `Desde $${minPrice.toLocaleString('es-CL')}`;
      } else if (service.id === 'pastillas-freno' && p.brake_pads) {
        newService.price = `Desde $${Number(p.brake_pads).toLocaleString('es-CL')}`;
      } else if (service.id === 'inspeccion-18-puntos' && p.inspection) {
        newService.price = `Desde $${Number(p.inspection).toLocaleString('es-CL')}`;
      }

      return newService;
    });
  }, [branding?.pricing]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patenteSearch.trim()) return;
    setIsSearching(true);
    await onCustomerSearch(patenteSearch.toUpperCase());
    setIsSearching(false);
  };

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPass || !onLogin) return;
    
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const { error } = await onLogin(loginEmail, loginPass);
      if (error) setLoginError(error.message);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Mesh Gradients */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/20 blur-[150px] rounded-full mix-blend-screen" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            x: [0, -100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" 
        />
        
        {/* Static Blobs */}
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[30%] left-[5%] w-80 h-80 bg-slate-500/5 blur-[100px] rounded-full" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#070b14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src={logoVespucio} alt="Lubricentro Vespucio" className="h-10 md:h-12 w-auto brightness-110" />
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-sm font-bold tracking-wide uppercase text-slate-400 hover:text-orange-500 transition-colors">Servicios</a>
            <a href="#ubicacion" className="text-sm font-bold tracking-wide uppercase text-slate-400 hover:text-orange-500 transition-colors">Ubicación</a>
            <button 
              onClick={() => setIsAdminLoginOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-full transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Acceso Taller
            </button>
          </div>

          <button className="md:hidden p-2 text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[#070b14] border-b border-white/10 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                <a href="#servicios" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold">Servicios</a>
                <a href="#ubicacion" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold">Ubicación</a>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAdminLoginOpen(true);
                  }}
                  className="w-full bg-orange-500 py-4 rounded-2xl font-black uppercase tracking-widest"
                >
                  Acceso Taller
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Calidad Certificada en Vespucio
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95]"
            >
              MANTÉN TU <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 drop-shadow-2xl">MOTOR</span> AL 100%.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium"
            >
              Especialistas en lubricación automotriz técnica. Tecnología de diagnóstico avanzada y los mejores aceites para prolongar la vida útil de tu vehículo.
            </motion.p>

            <div className="flex flex-wrap gap-5">
              <div className="w-full sm:w-auto flex flex-col gap-4">
                <form onSubmit={handleSearch} className="group relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-3xl overflow-hidden focus-within:border-orange-500/50 transition-all">
                  <div className="flex items-center gap-3 px-5 text-orange-500">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Escribe tu patente..." 
                    className="flex-1 bg-transparent border-none outline-none text-white font-bold py-4 placeholder:text-slate-600 uppercase"
                    value={patenteSearch}
                    onChange={(e) => setPatenteSearch(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="bg-orange-500 hover:bg-orange-600 text-white h-full px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSearching ? 'Buscando...' : 'Consultar'}
                  </button>
                </form>
                <div className="flex gap-2 px-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mt-1" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Consulta el estado de tu cambio de aceite ahora
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-5 w-full md:w-auto">
                <button 
                  onClick={onOpenBooking}
                  className="group relative flex items-center gap-3 bg-white text-slate-950 font-black text-sm uppercase tracking-widest px-10 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                >
                  <div className="absolute inset-0 bg-orange-500 translate-x-1 translate-y-1 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Calendar className="w-5 h-5" />
                  Agendar Mi Filtro
                </button>
                
                <button 
                  onClick={() => window.open('tel:+56912345678', '_self')}
                  className="flex items-center gap-3 px-10 py-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all font-black text-sm uppercase tracking-widest"
                >
                  <Phone className="w-5 h-5 text-orange-500" />
                  +56 9 9069 9021
                </button>
              </div>
            </div>

            <div className="flex items-center gap-10 pt-8 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-3xl font-black">4.9/5</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Ranking Google</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="space-y-1">
                <p className="text-3xl font-black">15min</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Cambio Express</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 aspect-[4/5] rounded-[48px] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1486006396193-47101fd90ee7?q=80&w=1200" 
                alt="Workshop High Tech" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/20 to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10 p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 space-y-4">
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#070b14] bg-slate-800 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#070b14] bg-orange-500 flex items-center justify-center text-[10px] font-black">
                    +2K
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-300">
                  <span className="text-white font-black">Cientos de clientes</span> confían su vehículo en Lubrivespucio cada mes.
                </p>
              </div>
            </div>
            
            {/* Floating Element */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full -z-10" 
            />
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-orange-500 text-xs font-black uppercase tracking-[0.4em]">Propuesta de Valor</h2>
              <h3 className="text-5xl md:text-6xl font-black tracking-tight italic">Servicios de precisión técnica.</h3>
            </div>
            <p className="text-slate-400 max-w-sm text-sm leading-relaxed font-medium">
              Cada servicio es ejecutado con protocolos de fábrica para asegurar la integridad de tu garantía automotriz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dynamicServices.map((service, idx) => (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedService(service)}
                className="group relative p-10 rounded-[40px] bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500 mb-8 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-xl shadow-orange-500/0 group-hover:shadow-orange-500/20">
                     {service.icon === 'Droplet' && <Droplet className="w-8 h-8" />}
                     {service.icon === 'Settings' && <Settings className="w-8 h-8" />}
                     {service.icon === 'ShieldCheck' && <ShieldCheck className="w-8 h-8" />}
                     {service.icon === 'Scan' && <Scan className="w-8 h-8" />}
                     {service.icon === 'Clock' && <Clock className="w-8 h-8" />}
                  </div>
                  <h4 className="text-2xl font-black mb-4 group-hover:text-orange-500 transition-colors">{service.title}</h4>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm font-black text-orange-500 uppercase tracking-widest">{service.price}</span>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-orange-500 transition-colors">
                      Ver detalle
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLogin={handleAdminLogin}
        isLoggingIn={isLoggingIn}
        loginError={loginError}
        email={loginEmail}
        setEmail={setLoginEmail}
        pass={loginPass}
        setPass={setLoginPass}
      />

      <ServiceDetailModal
        service={selectedService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        onBook={onOpenBooking}
      />

      {/* Location/Info Section */}
      <section id="ubicacion" className="py-32 bg-white/5 relative z-10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div>
                <h2 className="text-orange-500 text-xs font-black uppercase tracking-[0.4em] mb-4">Dónde Estamos</h2>
                <h3 className="text-5xl font-black mb-6">Visítanos en Vespucio.</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  Ubicación estratégica para clientes de Maipú, Pudahuel y Cerrillos. Amplio estacionamiento y zona de espera VIP.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <MapPin className="text-orange-500 shrink-0" />
                  <div>
                    <h5 className="font-black text-sm uppercase tracking-widest mb-1">Dirección</h5>
                    <p className="text-sm text-slate-400">Av. Américo Vespucio 310, Maipú</p>
                  </div>
                </div>
                <div className="flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <Clock className="text-orange-500 shrink-0" />
                  <div>
                    <h5 className="font-black text-sm uppercase tracking-widest mb-1">Horario</h5>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>Lun - Vie: 09:30 - 19:00</p>
                      <p>Sáb: 09:30 - 17:00</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-1 rounded-[32px] bg-gradient-to-r from-orange-600 to-orange-400">
                <div className="bg-[#070b14] rounded-[30px] p-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Atención Telefónica</p>
                    <p className="text-2xl font-black text-white">+56 9 9069 9021</p>
                  </div>
                  <button className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                    <Phone />
                  </button>
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-video rounded-[48px] overflow-hidden border border-white/10 bg-slate-900 shadow-2xl group"
            >
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Av.+Americo+Vespucio+310,+Maipu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative block w-full h-full"
              >
                <img 
                  src={mapVespucio} 
                  alt="Ubicación Lubricentro Vespucio" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                  <div className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/20 flex items-center gap-3 shadow-2xl">
                    <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-white">Abrir Google Maps</span>
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Punto Exacto</span>
                </div>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 relative z-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-4">
            <img src={logoVespucio} alt="Logo" className="h-10 grayscale opacity-50" />
            <div className="w-px h-6 bg-white/10" />
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
              &copy; 2026 Lubricentro Vespucio
            </p>
          </div>

          <div className="flex gap-8">
            <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-orange-500 hover:bg-white/10 transition-all">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-orange-500 hover:bg-white/10 transition-all">
              <Star className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
