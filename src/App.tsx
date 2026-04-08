import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Layout } from './components/Layout';
import { format } from 'date-fns';
import { KanbanBoard } from './components/KanbanBoard';
import { AddTicketModal } from './components/AddTicketModal';
import { Login } from './components/Login';
import { CustomerPortal } from './components/CustomerPortal';
import { Inventory } from './components/Inventory';
import { Customers } from './components/Customers';
import { useGarageStore } from './hooks/useGarageStore';
import { useAuth } from './hooks/useAuth';
import { UsersAdmin } from './components/UsersAdmin';
import { Ticket, Reminder, TicketStatus } from './types';

import { Mechanics } from './components/Mechanics';
import { AddMechanicModal } from './components/AddMechanicModal';
import { EditTicketModal } from './components/EditTicketModal';
import { InspeccionModal } from './components/InspeccionModal';
import { SettingsForm } from './components/SettingsForm';
import { Agenda } from './components/Agenda';
import { ChecklistIngresoModal } from './components/ChecklistIngresoModal';
import { supabase, supabaseGarage } from './lib/supabase';
import LandingPage from './components/LandingPage';
import { PublicBookingModal } from './components/PublicBookingModal';
import { Sales } from './components/Sales';
import { SalaVentas } from './components/SalaVentas';
import { AIConsultant } from './components/AIConsultant';
import { Garantias } from './components/Garantias';
import { MessagesSettings } from './components/MessagesSettings';
import { LandingEditor } from './components/LandingEditor';
import { LiveEditOverlay } from './components/LiveEditOverlay';
import { UpdateNotifier } from './components/UpdateNotifier';
import { LandingPageConfig } from './types';
import { SkeletonLoader } from './components/SkeletonLoader';
import { LandingNexus } from './components/LandingNexus';
import { Globe, HardDrive } from 'lucide-react';


type ViewState = 'landing' | 'customer' | 'dashboard';

export default function App() {
  const [view, setView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('garage_garage_view');
    return (saved as ViewState) || 'landing';
  });
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('garage_garage_tab') || 'dashboard';
  });
  
  useEffect(() => {
    localStorage.setItem('garage_garage_view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('garage_garage_tab', activeTab);
  }, [activeTab]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMechanicModalOpen, setIsAddMechanicModalOpen] = useState(false);
  const [isInspeccionModalOpen, setIsInspeccionModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [publicBranding, setPublicBranding] = useState<any>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [inspeccionTicket, setInspeccionTicket] = useState<Ticket | null>(null);
  const [checklistTicket, setChecklistTicket] = useState<Ticket | null>(null);
  const [searchedPatente, setSearchedPatente] = useState<string | null>(null);
  const [currentCustomerTicket, setCurrentCustomerTicket] = useState<Ticket | null>(null);
  const [currentCustomerTickets, setCurrentCustomerTickets] = useState<Ticket[]>([]);
  const [currentCustomerReminder, setCurrentCustomerReminder] = useState<Reminder | null>(null);

  // Live Edit Overlay state
  const [liveEditState, setLiveEditState] = useState<{
    cfg: LandingPageConfig;
    setCfg: (cfg: LandingPageConfig) => void;
  } | null>(null);


  const [searchTerm, setSearchTerm] = useState('');
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isMonitorMode, setIsMonitorMode] = useState(false);

  const { isSuperAdmin, profile } = useAuth();
  
  const [tenantConfig, setTenantConfig] = useState<any>(null);
  const [isSaasDomain, setIsSaasDomain] = useState(false);
  const [resolvingDomain, setResolvingDomain] = useState(true);

  // El companyId efectivo depende de si estamos logueados o si el dominio nos da uno
  const effectiveCompanyId = profile?.company_id || tenantConfig?.id;

  const {
    // Garage operations
    tickets, mechanics, parts, customers, settings, loading, reminders, notifications,
    addTicket, updateTicketStatus, updateTicket, searchTicket,
    addPart, updatePart, deletePart,
    addCustomer, updateCustomer, deleteCustomer,
    updateVehicle, deleteVehicle,
    updateSettings,
    addMechanic, deleteMechanic,
    acceptQuotation, markNotificationAsRead,
    clearFinishedTickets, deleteTicket,
    searchTicketsHistory,
    fetchCompanies, addIntelligentReminder, fetchActiveReminder, fetchPublicSettingsBySlug, fetchOccupiedReminders, fetchPublicVehicleInfo,
    addReminder, deleteReminder, updateReminder, refreshData, uploadTicketPhoto,
    salaVentas, addSalaVenta, fetchSalaVentas, deleteSalaVenta,
    saveCustomerFeedback, garantias, addGarantia, updateGarantia, deleteGarantia,
    fetchDomainConfig
  } = useGarageStore(effectiveCompanyId);

  // Resolución de Dominio
  useEffect(() => {
    const resolveDomain = async () => {
      try {
        const hostname = window.location.hostname;
        
        // Dominios base del SaaS
        const saasDomains = ['localhost', 'nexusgarage.vercel.app', 'nexusgarage.com'];
        if (saasDomains.includes(hostname)) {
          setIsSaasDomain(true);
          setResolvingDomain(false);
          return;
        }

        // Consultar configuración del taller por dominio
        const config = await fetchDomainConfig(hostname);
        if (config) {
          setTenantConfig(config);
          setIsSaasDomain(false);
        } else {
          // Si no existe el dominio, mostramos el SaaS o un 404
          setIsSaasDomain(true);
        }
      } catch (err) {
        console.error('Error resolving domain:', err);
        setIsSaasDomain(true);
      } finally {
        setResolvingDomain(false);
      }
    };

    resolveDomain();
  }, [fetchDomainConfig]);

  // Dynamic Favicon Update
  useEffect(() => {
    if (settings?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings?.favicon_url]);

  // Monitor Mode Auto-refresh
  useEffect(() => {
    let interval: any;
    if (isMonitorMode && activeTab === 'dashboard') {
      interval = setInterval(() => {
        refreshData();
      }, 10000); // 10 seconds
    }
    return () => clearInterval(interval);
  }, [isMonitorMode, activeTab, refreshData]);

  useEffect(() => {
    // Detect public branding from URL slug (?t=slug) o por dominio
    if (tenantConfig) {
      setPublicBranding(settings || {
        workshop_name: tenantConfig.nombre,
        theme_menu_highlight: tenantConfig.color_principal || '#f97316',
        logo_url: tenantConfig.logo_url
      });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('t') || 'lubrivespucio';
    if (slug) {
      fetchPublicSettingsBySlug(slug).then(data => {
        setPublicBranding(data || {
          theme_menu_highlight: '#f97316',
          theme_menu_text: '#34d399',
          workshop_name: 'Lubricentro Vespucio'
        });
      }).catch(err => {
        console.error('Error fetching public branding:', err);
        setPublicBranding({
          theme_menu_highlight: '#f97316',
          theme_menu_text: '#34d399',
          workshop_name: 'Lubricentro Vespucio'
        });
      });
    }
  }, [fetchPublicSettingsBySlug, tenantConfig, settings]);

  // Sync logged-in settings explicitly with public branding
  // so changes hit the LandingPage directly without reload
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setPublicBranding(settings);
    }
  }, [settings]);

  // Handle direct links with patente (?p=BBBB00)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patente = params.get('p');
    if (patente && publicBranding && view === 'landing') {
      handleCustomerSearch(patente);
    }
  }, [publicBranding, view]);

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsEditModalOpen(true);
  };

  const handleLogin = () => {
    setView('dashboard');
  };

  const handleAuthLogin = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (!error && data.user) {
      handleLogin();
    }
    return { error };
  };

  const handleCustomerSearch = async (patenteOrPhone: string) => {
    try {
      const targetCompanyId = publicBranding?.company_id;
      const tickets = await searchTicketsHistory(patenteOrPhone, targetCompanyId);
      const reminder = await fetchActiveReminder(patenteOrPhone, targetCompanyId);

      if (tickets.length > 0) {
        // Ordenar: No finalizados primero, luego por fecha de creación desc
        const sorted = [...tickets].sort((a, b) => {
          if (a.status !== 'Finalizado' && b.status === 'Finalizado') return -1;
          if (a.status === 'Finalizado' && b.status !== 'Finalizado') return 1;
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        
        setCurrentCustomerTickets(sorted);
        setCurrentCustomerTicket(sorted[0]);
        setCurrentCustomerReminder(null);
        setView('customer');
      } else if (reminder) {
        setCurrentCustomerReminder(reminder);
        setCurrentCustomerTicket(null);
        setCurrentCustomerTickets([]);
        setView('customer');
      } else {
        alert('No se encontró información para esa patente o teléfono.');
      }
    } catch (err) {
      console.error('Error in customer search:', err);
    }
  };

  const handleRefreshPortal = async () => {
    const identifier = currentCustomerTicket?.patente || currentCustomerTicket?.id || currentCustomerReminder?.patente;
    if (identifier) {
      await handleCustomerSearch(identifier);
    }
  };

  const handleBackToLogin = () => {
    setView('landing');
    setSearchedPatente(null);
    setCurrentCustomerTicket(null);
    setCurrentCustomerReminder(null);
    setActiveTab('dashboard');
  };

  const handlePromoteReminder = async (reminder: Reminder, targetStatus: TicketStatus) => {
    try {
      await addTicket({
        id: reminder.patente,
        model: reminder.vehicle_model,
        owner_name: reminder.customer_name,
        owner_phone: reminder.customer_phone,
        status: targetStatus,
        notes: `Cita Programada: ${reminder.reminder_type}. Agendada para ${new Date(reminder.planned_date).toLocaleString()}`
      });
      await updateReminder(reminder.id, { completed: true });
    } catch (err) {
      console.error('Error promoting reminder to ticket:', err);
      alert('Error al convertir la cita en ticket activo.');
    }
  };

  const handleUpdateVehicleNotes = async (id: string, notes: string) => {
    const ticket = tickets.find(t => t.id === id || t.patente === id);
    const patente = ticket?.patente || id;
    
    // Optimistic update
    const updatedTickets = tickets.map(t => {
      const tNorm = (t.patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const targetNorm = (patente || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (tNorm === targetNorm && targetNorm) {
        return { ...t, vehicle_notes: notes };
      }
      return t;
    });
    // Since we don't have a setTickets setter in the component (it's in the store), 
    // we'll rely on updateTicket for the current one immediately which triggers a re-render
    // and then the bulk update in background + refreshData.
    
    if (patente) {
      const normPatente = patente.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const { error } = await supabaseGarage
        .from('garage_tickets')
        .update({ vehicle_notes: notes })
        .eq('patente', normPatente)
        .eq('company_id', profile?.company_id);
      
      if (error) {
        console.error('Error updating vehicle notes:', error);
        await updateTicket(id, { vehicle_notes: notes });
      } else {
        await updateTicket(id, { vehicle_notes: notes }); // Triggers local re-render
        await refreshData();
      }
    } else {
      await updateTicket(id, { vehicle_notes: notes });
    }
  };

  if (resolvingDomain) {
    return <SkeletonLoader />;
  }

  // Lógica de Vistas Segregada
  
  // 1. Caso: Dominio Principal del SaaS (Nexus Garage)
  if (isSaasDomain && view === 'landing') {
    return (
      <LandingNexus 
        onAdminAccess={() => {
          // Forzar vista de dashboard para mostrar login si no hay sesión
          setView('dashboard');
        }} 
      />
    );
  }

  // 2. Caso: Portal de Taller (Subdominio o Dominio de Taller)
  if (view === 'landing') {
    return (
      <>
        <LandingPage 
          onPortalAccess={() => {}} 
          onAdminAccess={handleLogin}
          onCustomerSearch={handleCustomerSearch}
          onOpenBooking={() => setIsBookingModalOpen(true)}
          onLogin={handleAuthLogin}
          fetchCompanies={fetchCompanies}
          onAddReminder={addIntelligentReminder}
          fetchOccupied={fetchOccupiedReminders}
          fetchVehicleInfo={fetchPublicVehicleInfo}
          branding={publicBranding}
        />
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          fetchCompanies={fetchCompanies}
          onAddReminder={addIntelligentReminder}
          fetchOccupied={fetchOccupiedReminders}
          fetchVehicleInfo={fetchPublicVehicleInfo}
          branding={publicBranding}
        />
      </>
    );
  }

  if (view === 'customer') {
    return (
      <CustomerPortal
        ticket={currentCustomerTicket}
        allTickets={currentCustomerTickets}
        reminder={currentCustomerReminder}
        settings={settings}
        onBack={handleBackToLogin}
        onAcceptQuotation={acceptQuotation}
        onRefresh={handleRefreshPortal}
        onSaveFeedback={saveCustomerFeedback}
      />
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleBackToLogin}
      notifications={notifications}
      markAsRead={markNotificationAsRead}
      settings={settings}
      isSuperAdmin={isSuperAdmin}
      branding={publicBranding}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      viewDate={viewDate}
      setViewDate={setViewDate}
      onAddTicket={() => setIsAddModalOpen(true)}
      onRefresh={refreshData}
      reminders={reminders}
      isMonitorMode={isMonitorMode}
      setIsMonitorMode={setIsMonitorMode}
    >
      <UpdateNotifier />
      {activeTab === 'dashboard' && (
        <KanbanBoard
          tickets={tickets}
          mechanics={mechanics}
          reminders={reminders}
          settings={settings}
          onUpdateStatus={updateTicketStatus}
          onEditTicket={handleEditTicket}
          onDeleteTicket={deleteTicket}
          onAddTicket={() => setIsAddModalOpen(true)}
          onClearFinished={clearFinishedTickets}
          onUpdateNotes={handleUpdateVehicleNotes}
          onPromoteReminder={handlePromoteReminder}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          viewDate={viewDate}
          setViewDate={setViewDate}
          onShowChecklist={(ticket) => {
            setChecklistTicket(ticket);
            setIsChecklistModalOpen(true);
          }}
          onShowInspeccion={(ticket) => {
            setInspeccionTicket(ticket);
            setIsInspeccionModalOpen(true);
          }}
          isMonitorMode={isMonitorMode}
          setIsMonitorMode={setIsMonitorMode}
        />
      )}

      {activeTab === 'sales' && (
        <Sales 
          tickets={tickets} 
          parts={parts} 
          settings={settings}
          salaVentas={salaVentas}
          mechanics={mechanics}
        />
      )}

      {activeTab === 'sala_ventas' && (
        <SalaVentas
          parts={parts}
          tickets={tickets}
          onAddSalaVenta={addSalaVenta}
          fetchSalaVentas={fetchSalaVentas}
          onDeleteSalaVenta={deleteSalaVenta}
          onDeleteTicket={deleteTicket}
          salaVentas={salaVentas}
          settings={settings}
        />
      )}

      {activeTab === 'garantias' && (
        <Garantias
          garantias={garantias}
          onAdd={addGarantia}
          onUpdate={updateGarantia}
          onDelete={deleteGarantia}
          settings={settings}
        />
      )}

      {activeTab === 'inventory' && (
        <Inventory 
          parts={parts} 
          settings={settings} 
          onAddPart={addPart} 
          onUpdatePart={updatePart} 
          onDeletePart={deletePart} 
        />
      )}

      {activeTab === 'agenda' && (
        <Agenda 
          tickets={tickets} 
          mechanics={mechanics} 
          customers={customers} 
          reminders={reminders}
          settings={settings}
          addReminder={addIntelligentReminder}
          updateReminder={updateReminder}
          deleteReminder={deleteReminder}
          fetchOccupiedReminders={fetchOccupiedReminders}
        />
      )}

      {activeTab === 'customers' && (
        <Customers
          customers={customers}
          tickets={tickets}
          settings={settings}
          onAddCustomer={addCustomer}
          onUpdateVehicle={updateVehicle}
          deleteVehicle={deleteVehicle}
          onUpdateNotes={handleUpdateVehicleNotes}
          searchTicket={searchTicket}
        />
      )}

      {activeTab === 'mechanics' && (
        <Mechanics
          mechanics={mechanics}
          tickets={tickets}
          onAdd={() => setIsAddMechanicModalOpen(true)}
          onDelete={deleteMechanic}
          onUpdateTicket={updateTicket}
        />
      )}

      {activeTab === 'settings' && (
        <div className="p-8">
          <SettingsForm 
            settings={settings} 
            onUpdate={updateSettings} 
            tickets={tickets}
            parts={parts}
          />
        </div>
      )}

      {activeTab === 'users' && isSuperAdmin && (
        <div className="p-8">
          <UsersAdmin />
        </div>
      )}

      {activeTab === 'ai_consultant' && (
        <div className="h-full">
          <AIConsultant 
            tickets={tickets}
            parts={parts}
            customers={customers}
            salaVentas={salaVentas}
            mechanics={mechanics}
            settings={settings}
          />
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="p-4 lg:p-8">
          <MessagesSettings 
            settings={settings}
            onUpdate={updateSettings}
            tickets={tickets}
          />
        </div>
      )}

      {activeTab === 'landing_editor' && (
        <LandingEditor
          settings={settings}
          onUpdate={updateSettings}
          onLiveEdit={(cfg, setCfg) => setLiveEditState({ cfg, setCfg })}
          onClose={() => setActiveTab('settings')}
        />
      )}

      {/* Live Edit Overlay — full screen, portal-like */}
      {liveEditState && (
        <LiveEditOverlay
          cfg={liveEditState.cfg}
          setCfg={liveEditState.setCfg}
          onUpdate={updateSettings}
          settings={settings}
          onClose={() => setLiveEditState(null)}
        />
      )}

      <AddTicketModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTicket}
        mechanics={mechanics}
        customers={customers}
        tickets={tickets}
        settings={settings}
        parts={parts}
        onUpdatePart={updatePart}
      />

      <AddMechanicModal
        isOpen={isAddMechanicModalOpen}
        onClose={() => setIsAddMechanicModalOpen(false)}
        onAdd={addMechanic}
      />
      <EditTicketModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ticket={editingTicket}
        tickets={tickets}
        mechanics={mechanics}
        parts={parts}
        onUpdate={updateTicket}
        onUploadPhoto={uploadTicketPhoto}
        onUpdatePart={updatePart}
        settings={settings}
      />
      
      {isInspeccionModalOpen && inspeccionTicket && (
        <InspeccionModal
          isOpen={isInspeccionModalOpen}
          onClose={() => setIsInspeccionModalOpen(false)}
          ticket={inspeccionTicket}
          onUpdate={async (id, updates) => {
            await updateTicket(id, updates);
            // Actualizar el ticket local para que el modal refleje el cambio inmediatamente si sigue abierto
            if (inspeccionTicket && inspeccionTicket.id === id) {
              setInspeccionTicket(prev => prev ? { ...prev, ...updates } : null);
            }
          }}
        />
      )}

      {isChecklistModalOpen && checklistTicket && (
        <ChecklistIngresoModal
          isOpen={isChecklistModalOpen}
          ticketPatente={checklistTicket.patente}
          initialData={checklistTicket.ingreso_checklist}
          onClose={() => setIsChecklistModalOpen(false)}
          settings={settings}
          onSave={async (checklist) => {
            await updateTicket(checklistTicket.id, { ingreso_checklist: checklist });
            setIsChecklistModalOpen(false);
          }}
        />
      )}
    </Layout>
  );
}
