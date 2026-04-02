import React, { useState } from 'react';
import {
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
  MessageCircle,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoVespucio from '@/assets/logo_vespucio.png';
import { LUBRIVESPUCIO_SERVICES } from '@/data/services';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(LUBRIVESPUCIO_SERVICES[0]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoVespucio} alt="Lubricentro Vespucio" className="h-12 w-auto" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-sm font-medium hover:text-orange-400 transition-colors">Servicios</a>
            <a href="#ubicacion" className="text-sm font-medium hover:text-orange-400 transition-colors">Ubicación</a>
            <button className="btn-primary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Agendar Cita
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Star className="w-3 h-3 fill-current" />
              El mejor servicio en Maipú
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
              Tu Lubricentro de <span className="text-orange-500">Confianza</span> en Vespucio.
            </h1>
            
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Cuidamos tu motor con tecnología de punta y los mejores insumos del mercado. Rapidez, transparencia y resultados garantizados en cada visita.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="btn-primary text-lg px-8 py-4">
                Agendar Mi Visita
              </button>
              <button className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold">
                <MessageCircle className="w-5 h-5 text-green-500" />
                WhatsApp
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">#310</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Ubicación</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">+10</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Servicios</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square rounded-[40px] overflow-hidden border border-white/10 shadow-2xl relative group">
              <img 
                src="https://images.unsplash.com/photo-1486006396193-47101fd90ee7?q=80&w=1200" 
                alt="Workshop" 
                className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8 glass-card p-6 rounded-3xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Garantía Lubrivespucio</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-slate-900">Mantenimiento certificado y seguro.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-orange-500 text-sm font-black uppercase tracking-[0.3em]">Servicios Especializados</h2>
            <h3 className="text-4xl md:text-5xl font-black">Lo que tu vehículo necesita.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LUBRIVESPUCIO_SERVICES.map((service) => (
              <motion.div 
                key={service.id}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-[32px] bg-slate-900 border border-white/5 hover:border-orange-500/50 transition-all duration-500"
              >
                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                   {service.icon === 'Droplet' && <Droplet />}
                   {service.icon === 'Settings' && <Settings />}
                   {service.icon === 'ShieldCheck' && <ShieldCheck />}
                   {service.icon === 'Wind' && <Wind />}
                   {service.icon === 'Cpu' && <Cpu />}
                </div>
                <h4 className="text-xl font-bold mb-3">{service.title}</h4>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {service.description}
                </p>
                <div className="space-y-2 mb-8">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-orange-500 font-black tracking-tight">{service.price}</span>
                  <button className="p-2 rounded-lg hover:bg-orange-500 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="ubicacion" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-orange-500 text-sm font-black uppercase tracking-[0.3em]">Ubicación</h2>
            <h3 className="text-4xl font-black">Estamos ubicados en Av. Américo Vespucio.</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Dirección</h4>
                  <p className="text-slate-400">Av. Américo Vespucio 310, Maipú, Región Metropolitana.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Horario de Atención</h4>
                  <p className="text-slate-400">Lunes a Viernes: 09:00 - 18:30</p>
                  <p className="text-slate-400">Sábado: 09:00 - 14:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                  <Phone className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Contacto</h4>
                  <p className="text-slate-400">+56 9 1234 5678</p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[500px] rounded-[40px] overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all duration-700">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3328.6083!2d-70.771!3d-33.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDMwJzAwLjAiUyA3MMKwNDYnMTUuNiJX!5e0!3m2!1ses!2scl!4v1711900000000!5m2!1ses!2scl" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <img src={logoVespucio} alt="Lubricentro Vespucio" className="h-8 w-auto opacity-50" />
          <p className="text-sm text-slate-500">© 2026 Lubricentro Vespucio #310. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-orange-500 transition-colors">Términos</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
