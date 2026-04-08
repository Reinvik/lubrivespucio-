import React from 'react';
import { Shield, Car, BarChart3, Clock, Users, Wrench, ArrowRight } from 'lucide-react';

interface LandingNexusProps {
  onAdminAccess: () => void;
}

export const LandingNexus: React.FC<LandingNexusProps> = ({ onAdminAccess }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Nexus Garage
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={onAdminAccess}
              className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-semibold hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-xl shadow-white/5"
            >
              Acceso Admin
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-4 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-600/10 blur-[120px] rounded-full -z-10" />
          
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-sm font-medium mb-8 animate-fade-in shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              SaaS Multi-Tenant para Talleres Mecánicos
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
              Gestiona tu taller <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                al siguiente nivel
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              La plataforma integral que centraliza tus tickets, inventario, clientes y finanzas en una interfaz diseñada para la velocidad y la excelencia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-orange-600/20 flex items-center justify-center gap-2 group">
                Empieza Ahora Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-lg transition-all backdrop-blur-sm">
                Ver Demo Online
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4 bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Clock className="w-8 h-8" />}
                title="Routing por Dominio"
                description="Cada taller tiene su propio subdominio (taller.nexusgarage.com) con branding personalizado."
              />
              <FeatureCard 
                icon={<BarChart3 className="w-8 h-8" />}
                title="Panel Multi-Empresa"
                description="Gestiona múltiples sucursales o empresas desde una sola interfaz administrativa."
              />
              <FeatureCard 
                icon={<Shield className="w-8 h-8" />}
                title="Seguridad Industrial"
                description="Tus datos protegidos con RLS de Supabase y encriptación de grado empresarial."
              />
              <FeatureCard 
                icon={<Car className="w-8 h-8" />}
                title="Portal de Clientes"
                description="Tus clientes pueden ver el estado de su vehículo y aprobar cotizaciones en tiempo real."
              />
              <FeatureCard 
                icon={<Users className="w-8 h-8" />}
                title="Gestión de Mecánicos"
                description="Asigna tareas, mide productividad y controla horarios de asistencia."
              />
              <FeatureCard 
                icon={<Wrench className="w-8 h-8" />}
                title="Inventario Inteligente"
                description="Control de stock con alertas automáticas y sugerencias de IA para compras."
              />
            </div>
          </div>
        </section>

        {/* Pricing/CTA */}
        <section className="py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-b from-orange-600 to-orange-700 p-12 rounded-[32px] shadow-2xl shadow-orange-600/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 rounded-full" />
            <h2 className="text-4xl font-black mb-6">¿Listo para transformar tu negocio?</h2>
            <p className="text-orange-100 text-lg mb-10">
              Únete a los talleres que ya están optimizando su operación con Nexus Garage.
            </p>
            <button className="px-10 py-4 rounded-xl bg-white text-orange-600 font-black text-xl hover:bg-slate-50 transition-colors shadow-xl">
              Crear mi Cuenta Gratis
            </button>
          </div>
        </section>
      </main>

      <footer className="py-12 px-4 border-t border-white/5 text-slate-500 text-center">
        <p>© 2026 Nexus Garage SaaS. Desarrollado por Nexus Production.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 rounded-[24px] bg-slate-950 border border-white/5 hover:border-orange-500/30 transition-all group overflow-hidden relative">
    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 blur-2xl group-hover:bg-orange-600/10 transition-colors" />
    <div className="text-orange-600 mb-6 bg-orange-600/10 w-fit p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4 group-hover:text-orange-400 transition-colors">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </div>
);
