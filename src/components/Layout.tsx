import React from 'react';
import { LayoutDashboard, Wrench, Package, Users, Settings, LogOut, Bell, Calendar, Menu, X, BarChart3, Search, CalendarCheck, Plus, RefreshCw, ShoppingCart, Sparkles, ShieldCheck, MessageCircle, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { GarageNotification, GarageSettings } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  notifications: GarageNotification[];
  markAsRead: (id: string) => Promise<void>;
  settings: GarageSettings | null;
  isSuperAdmin?: boolean;
  branding?: any;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  viewDate?: string;
  setViewDate?: (date: string) => void;
  onAddTicket?: () => void;
  onRefresh?: () => Promise<void>;
  reminders?: any[];
  isMonitorMode?: boolean;
  setIsMonitorMode?: (val: boolean) => void;
}

export function Layout({ 
  children, activeTab, setActiveTab, onLogout, notifications, markAsRead, settings, isSuperAdmin, branding,
  searchTerm, setSearchTerm, viewDate, setViewDate, onAddTicket, onRefresh, reminders = [],
  isMonitorMode = false, setIsMonitorMode
}: LayoutProps) {
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    setLogoError(false);
  }, [settings?.logo_url]);

  const menuTextColor = settings?.theme_sidebar_text || settings?.theme_menu_text || branding?.theme_menu_text || '#a1a1aa';
  const menuHighlightColor = settings?.theme_sidebar_active_text || settings?.theme_menu_highlight || branding?.theme_menu_highlight || '#ffffff';
  const sidebarBgColor = settings?.theme_sidebar_bg || '#18181b';
  const sidebarActiveBg = settings?.theme_sidebar_active_bg || '#27272a';
  const mainBgColor = settings?.theme_main_bg || '#f4f4f5';
  const primaryButtonColor = settings?.theme_button_color || '#ea580c';

  const sidebarBorderColor = sidebarBgColor === '#18181b' ? 'border-zinc-800' : 'border-black/10';
  const highlightBg = sidebarActiveBg;

  const navItems = [
    { id: 'dashboard', label: 'Tablero Kanban', icon: LayoutDashboard },
    { id: 'sales', label: 'Informe de Ventas', icon: BarChart3 },
    { id: 'sala_ventas', label: 'Sala Ventas', icon: ShoppingCart },
    { id: 'garantias', label: 'Garantías', icon: ShieldCheck },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'mechanics', label: 'Mecánicos', icon: Wrench },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'messages', label: 'Mensajes', icon: MessageCircle },
    { id: 'ai_consultant', label: 'Consultor IA', icon: Sparkles },
    { id: 'landing_editor', label: 'Landing Page', icon: Globe },
  ];

  if (isSuperAdmin) {
    navItems.push({ id: 'users', label: 'Admin Usuarios', icon: Users });
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  const primaryShadow = primaryButtonColor.startsWith('#') && primaryButtonColor.length === 7 
    ? `${primaryButtonColor}33` 
    : 'rgba(234, 88, 12, 0.2)';

  return (
    <div 
      className="flex h-screen w-full font-sans overflow-hidden transition-colors"
      style={{ 
        '--primary': primaryButtonColor,
        '--primary-shadow': primaryShadow,
        backgroundColor: mainBgColor
      } as React.CSSProperties}
    >
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
            "fixed inset-y-0 left-0 w-72 flex flex-col z-50 transition-all duration-300 lg:relative lg:translate-x-0 lg:w-64 shrink-0 shadow-2xl lg:shadow-none",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            isMonitorMode && "hidden"
        )}
        style={{ backgroundColor: sidebarBgColor }}
      >
        <div className={cn("p-6 flex items-center justify-between border-b", sidebarBorderColor)}>
          <div className="flex items-center gap-3">
            <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border"
                style={{ backgroundColor: sidebarActiveBg, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {settings?.logo_url && !logoError ? (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                   className="w-full h-full object-contain transition-transform"
                   style={{
                       transform: `scale(${settings.logo_scale || 1}) translate(${settings.logo_x_offset || 0}px, ${settings.logo_y_offset || 0}px)`
                   }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-16 h-16 bg-black/20 rounded-xl flex items-center justify-center p-1">
                  <img src="/logo3.png" alt="Lubricentro Vespucio" className="w-14 h-14 object-contain" />
                </div>
              )}
            </div>
            <span 
                className="font-bold text-lg tracking-tight leading-tight"
                style={{ color: '#ffffff' }} // Keep white/zinc-100 for dark sidebar generally, but could use theme_menu_highlight
            >
                {settings?.workshop_name || 'Lubricentro Vespucio'}
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto dark-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as any)}
                style={{
                  color: isActive ? menuHighlightColor : menuTextColor,
                  backgroundColor: isActive ? highlightBg : 'transparent'
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full font-medium hover:bg-zinc-800/50",
                  isActive && "font-bold shadow-sm"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className={cn("p-4 border-t", sidebarBorderColor)}>
          <button
            onClick={() => handleTabChange('settings')}
            style={{
              color: activeTab === 'settings' ? menuHighlightColor : menuTextColor,
              backgroundColor: activeTab === 'settings' ? highlightBg : 'transparent'
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full hover:bg-zinc-800/50",
              activeTab === 'settings' && "font-bold shadow-sm"
            )}
          >
            <Settings className="w-5 h-5" />
            Configuración
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
        <div 
            className="p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
        >
          <button
            onClick={async () => {
              if (onRefresh) {
                setIsRefreshing(true);
                await onRefresh();
                setTimeout(() => setIsRefreshing(false), 1000);
              }
            }}
            disabled={isRefreshing}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 w-full transition-all uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Sincronizando...' : 'Refrescar Datos'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        {!isMonitorMode && (
        <header 
            className="h-14 lg:h-16 border-b border-zinc-200 flex items-center justify-between px-2 lg:px-8 shrink-0"
            style={{ backgroundColor: settings?.theme_header_bg || '#ffffff' }}
        >
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            {activeTab !== 'dashboard' ? (
              <h1 
                className="text-base lg:text-xl font-bold tracking-tight truncate max-w-[150px] md:max-w-none ml-1"
                style={{ color: settings?.theme_header_text || '#1f2937' }}
              >
                {navItems.find(i => i.id === activeTab)?.label || 'Configuración'}
              </h1>
            ) : (
              <div className="flex flex-row items-center gap-2 flex-1 w-full overflow-hidden">
                <h1 
                    className="text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap hidden sm:block"
                    style={{ color: settings?.theme_header_text || '#1f2937' }}
                >
                    Flujo de Trabajo
                </h1>
                <div className="relative flex-1 max-w-md w-full min-w-0">
                  <Search 
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" 
                    style={{ color: settings?.theme_header_text + '80' || '#a1a1aa' }}
                  />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-400"
                    style={{ 
                        backgroundColor: settings?.theme_header_bg === '#ffffff' ? '#f4f4f5' : 'rgba(0,0,0,0.05)',
                        color: settings?.theme_header_text || '#1f2937'
                    }}
                    value={searchTerm}
                    onChange={e => setSearchTerm?.(e.target.value)}
                  />
                </div>
 
                <div className="relative flex-shrink-0">
                  <Calendar 
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" 
                    style={{ color: settings?.theme_header_text + '80' || '#a1a1aa' }}
                  />
                  <input
                    type="date"
                    className="pl-7 pr-3 py-1.5 text-[10px] sm:text-xs rounded-lg border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold"
                    style={{ 
                        backgroundColor: settings?.theme_header_bg === '#ffffff' ? '#f4f4f5' : 'rgba(0,0,0,0.05)',
                        color: settings?.theme_header_text || '#1f2937'
                    }}
                    value={viewDate}
                    onChange={e => setViewDate?.(e.target.value)}
                  />
                </div>

                {searchTerm && searchTerm.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto w-full max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Citas Agendadas</span>
                    </div>
                    <div className="space-y-2">
                      {reminders.filter(r => 
                        r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.customer_phone.includes(searchTerm) ||
                        r.patente.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100 shadow-sm">
                          <div>
                            <div className="text-xs font-bold text-zinc-900">{r.customer_name}</div>
                            <div className="text-[10px] text-zinc-500">{r.patente} • {new Date(r.planned_date).toLocaleDateString()}</div>
                          </div>
                          <div className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full capitalize">
                            {r.reminder_type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-4 ml-4">
            {activeTab === 'dashboard' && (
              <button
                onClick={onAddTicket}
                style={{ backgroundColor: primaryButtonColor }}
                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 sm:py-2 hover:brightness-110 text-white rounded-lg sm:rounded-xl font-medium transition-all shadow-md shrink-0 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline ml-2">Nuevo Ingreso</span>
              </button>
            )}
          </div>
        </header>
        )}

        {/* Monitor Mode Overlay Logo */}
        {isMonitorMode && (
          <div className="fixed top-4 right-4 z-50 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-zinc-200 shadow-lg scale-90 md:scale-100">
               <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center p-1 border border-zinc-700">
                  <img src="/logo3.png" alt="Lubricentro Vespucio" className="w-8 h-8 object-contain" />
               </div>
               <div className="flex flex-col">
                  <span className="text-sm font-black text-zinc-900 leading-none uppercase">LUBRICENTRO</span>
                  <span className="text-[8px] font-bold text-zinc-500 tracking-[0.15em] uppercase">VESPUCIO</span>
               </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className={cn(
          "flex-1 overflow-auto p-4 lg:p-8",
          isMonitorMode && "p-0"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
