import React, { useState, useEffect } from 'react';
// SettingsForm v2 - loads config from DB, shows existing logos
import { GarageSettings } from '../types';
import {
  Save, Building2, MapPin, Phone, MessageSquare, Loader2, CheckCircle,
  Palette, Download, FileSpreadsheet, Lock, Eye, EyeOff, ScrollText,
  Puzzle, CircleDollarSign, Layout as LayoutIcon, Settings, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ticket, Part } from '../types';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { OperationsManual } from './OperationsManual';
import { ImageUpload } from './ImageUpload';

interface SettingsFormProps {
  settings: GarageSettings | null;
  onUpdate: (updates: Partial<GarageSettings>) => Promise<void>;
  tickets?: Ticket[];
  parts?: Part[];
}

type ActiveTab = 'general' | 'design' | 'pricing' | 'security' | 'export' | 'manual' | 'extension';

const DEFAULT_PRICING = {
  oil_changes: [
    { id: '1', name: 'Cambio de Aceite Básico (20W50)', price: 29000 },
    { id: '2', name: 'Cambio de Aceite Full Sintético (5W30)', price: 72000 },
  ],
  brakes: [
    { id: '3', name: 'Cambio Pastillas de Freno', price: 30000 },
  ],
  tune_ups: [
    { id: '4', name: 'Inspección Preventiva', price: 35000 },
  ],
};

export function SettingsForm({ settings, onUpdate, tickets, parts }: SettingsFormProps) {
  const [formData, setFormData] = useState<Partial<GarageSettings>>({
    workshop_name: '',
    address: '',
    phone: '',
    whatsapp_template: '',
    logo_url: '',
    logo_scale: 1,
    logo_x_offset: 50,
    logo_y_offset: 50,
    theme_menu_text: '#a1a1aa',
    theme_menu_highlight: '#f97316',
    theme_button_color: '#ea580c',
    theme_sidebar_bg: '#18181b',
    theme_sidebar_active_bg: '#27272a',
    theme_sidebar_text: '#a1a1aa',
    theme_sidebar_active_text: '#ffffff',
    theme_main_bg: '#f4f4f5',
    theme_card_bg: '#ffffff',
    theme_accent_color: '#f97316',
    theme_header_bg: '#ffffff',
    theme_header_text: '#1f2937',
    company_slug: '',
    favicon_url: '',
    admin_password: '',
    pricing: DEFAULT_PRICING,
  });

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');

  // Password state
  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        workshop_name:           settings.workshop_name || '',
        address:                 settings.address || '',
        phone:                   settings.phone || '',
        whatsapp_template:       settings.whatsapp_template || '',
        logo_url:                settings.logo_url   || '',
        logo_scale:              settings.logo_scale  ?? 1,
        logo_x_offset:           settings.logo_x_offset ?? 50,
        logo_y_offset:           settings.logo_y_offset ?? 50,
        theme_menu_text:         settings.theme_menu_text         || '#a1a1aa',
        theme_menu_highlight:    settings.theme_menu_highlight    || '#f97316',
        theme_button_color:      settings.theme_button_color      || '#ea580c',
        theme_sidebar_bg:        settings.theme_sidebar_bg        || '#18181b',
        theme_sidebar_active_bg: settings.theme_sidebar_active_bg || '#27272a',
        theme_sidebar_text:      settings.theme_sidebar_text      || '#a1a1aa',
        theme_sidebar_active_text: settings.theme_sidebar_active_text || '#ffffff',
        theme_main_bg:           settings.theme_main_bg           || '#f4f4f5',
        theme_card_bg:           settings.theme_card_bg           || '#ffffff',
        theme_accent_color:      settings.theme_accent_color      || '#f97316',
        theme_header_bg:         settings.theme_header_bg         || '#ffffff',
        theme_header_text:       settings.theme_header_text       || '#1f2937',
        company_slug:            settings.company_slug            || '',
        favicon_url:             settings.favicon_url             || '',
        admin_password:          settings.admin_password          || '',
        pricing:                 settings.pricing                 || DEFAULT_PRICING,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sync logo_url and branding into landing_config so the public landing page sees the logo
      const existingLandingConfig = (settings as any)?.landing_config || {};
      const mergedUpdates: Partial<GarageSettings> = {
        ...formData,
        landing_config: {
          ...existingLandingConfig,
          ...(formData as any).landing_config,
          // Always sync the logo and workshop name so the nav logo updates
          ...(formData.logo_url ? { header_logo_url: formData.logo_url } : {}),
          ...(formData.workshop_name ? { footer_copyright: `© ${new Date().getFullYear()} ${formData.workshop_name}` } : {}),
        },
      };
      await onUpdate(mergedUpdates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = (data: any[], filename: string) => {
    if (!data || data.length === 0) { alert('No hay datos para exportar.'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    const headers = Object.keys(data[0]);
    ws['!cols'] = headers.map(h => ({
      wch: Math.max(...[h, ...data.map(r => (r[h]?.toString() || ''))].map(v => v.length)) + 2,
    }));
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportTickets = () => {
    if (!tickets) { alert('Cargando tickets...'); return; }
    downloadExcel(tickets.map(t => ({
      Patente: t.patente || t.id,
      Cliente: t.owner_name,
      Telefono: t.owner_phone,
      Modelo: t.model,
      KM: t.mileage,
      Estado: t.status,
      'Fecha Ingreso': t.entry_date ? new Date(t.entry_date).toLocaleDateString('es-CL') : '',
      'Ultimo Cambio': t.last_status_change ? new Date(t.last_status_change).toLocaleDateString('es-CL') : '',
      Mecanico: t.mechanic || 'Sin asignar',
      Notas: t.notes || '',
      Total: t.cost || 0,
    })), 'tickets_vespucio');
  };

  const handleExportParts = () => {
    if (!parts) { alert('Cargando repuestos...'); return; }
    downloadExcel(parts.map(p => ({
      Codigo: p.id,
      Nombre: p.name,
      Stock: p.stock,
      'Stock Minimo': p.min_stock,
      Precio: p.price,
    })), 'repuestos_vespucio');
  };

  // ─── Sub-components ────────────────────────────────────────────────────────

  const ColorPicker = ({ label, value, onChange, description }: {
    label: string; value: string; onChange: (v: string) => void; description?: string;
  }) => (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
          {description && <span className="text-[9px] text-zinc-400">{description}</span>}
        </div>
        <span className="text-[9px] font-mono text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">{value}</span>
      </div>
      <div className="flex items-center gap-3 p-1.5 rounded-2xl border border-zinc-200/60 bg-white/40 backdrop-blur-md shadow-sm hover:border-zinc-300 transition-all">
        <label className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden border border-zinc-100 cursor-pointer">
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            className="absolute inset-[-4px] w-[150%] h-[150%] cursor-pointer bg-transparent border-none scale-125" />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none" />
        </label>
        <input type="text" value={value} maxLength={7}
          onChange={e => {
            const v = e.target.value;
            if (v.startsWith('#') && v.length <= 7) onChange(v);
            else if (!v.startsWith('#') && v.length <= 6) onChange('#' + v);
          }}
          className="flex-1 bg-transparent border-none text-xs font-mono font-bold text-zinc-700 outline-none uppercase"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const DashboardPreview = () => (
    <div className="sticky top-8 space-y-6">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Simulador en Vivo</h4>
        <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
          <button type="button" onClick={() => setPreviewMode('desktop')}
            className={cn('p-1.5 rounded-md transition-all', previewMode === 'desktop' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400')}>
            <LayoutIcon className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setPreviewMode('mobile')}
            className={cn('p-1.5 rounded-md transition-all', previewMode === 'mobile' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400')}>
            <Phone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={cn(
        'mx-auto bg-zinc-900 rounded-[2.5rem] border-[10px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col relative group transition-all duration-500 ring-1 ring-white/10',
        previewMode === 'mobile' ? 'w-[280px] aspect-[9/18.5]' : 'w-full aspect-[16/10]'
      )}>
        <div className={cn('bg-zinc-800 flex items-center px-4 gap-2 shrink-0', previewMode === 'mobile' ? 'h-10' : 'h-6')}>
          {previewMode === 'desktop' && (
            <>
              <div className="w-3 h-3 rounded-sm bg-white/10 flex items-center justify-center overflow-hidden ring-1 ring-white/5">
                {formData.favicon_url ? <img src={formData.favicon_url} className="w-full h-full object-contain" alt="fav" /> : <div className="w-full h-full bg-zinc-600 rounded-full" />}
              </div>
              <div className="h-2 w-24 bg-zinc-700/50 rounded-full" />
            </>
          )}
          {previewMode === 'mobile' && <div className="text-[10px] text-white font-bold font-mono">9:41</div>}
        </div>

        <div className={cn('flex-1 min-h-0 flex', previewMode === 'mobile' && 'flex-col')}>
          <div
            className={cn('shrink-0 flex transition-all duration-500 border-white/5', previewMode === 'mobile' ? 'order-2 h-16 w-full flex-row justify-around items-center px-4 border-t' : 'w-16 flex-col border-r')}
            style={{ backgroundColor: formData.theme_sidebar_bg || '#18181b' }}
          >
            {previewMode === 'desktop' && (
              <div className="p-3 mb-4">
                <div className="w-full aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-1">
                  {formData.logo_url
                    ? <img src={formData.logo_url} className="w-full h-full object-contain" style={{ transform: `scale(${formData.logo_scale})` }} alt="logo" />
                    : <div className="w-4 h-4 rounded-full bg-white/20 animate-pulse" />}
                </div>
              </div>
            )}
            <div className={cn('flex', previewMode === 'mobile' ? 'flex-row w-full justify-between px-6' : 'flex-col px-2 gap-2')}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={cn('rounded-full transition-all', previewMode === 'mobile' ? 'w-6 h-6' : 'w-full h-2')}
                  style={{ backgroundColor: i === 1 ? (formData.theme_sidebar_active_bg || '#27272a') : 'transparent', opacity: i === 1 ? 1 : 0.3 }} />
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: formData.theme_main_bg || '#f4f4f5' }}>
            <div className={cn('shrink-0 flex items-center px-4 gap-4', previewMode === 'mobile' ? 'h-12' : 'h-9 border-b border-zinc-200/50')}
              style={{ backgroundColor: formData.theme_header_bg || '#ffffff' }}>
              <div className="h-2 w-20 rounded-full" style={{ backgroundColor: formData.theme_header_text || '#1f2937', opacity: 0.7 }} />
              <div className="ml-auto w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-7 w-24 rounded-xl shadow-sm" style={{ backgroundColor: formData.theme_button_color || '#ea580c' }} />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl border border-zinc-200/50 p-3 space-y-2" style={{ backgroundColor: formData.theme_card_bg || '#ffffff' }}>
                    <div className="h-1.5 w-10 bg-zinc-100 rounded-full" />
                    <div className="h-3 w-16 bg-zinc-50 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Tab renderers ─────────────────────────────────────────────────────────

  const renderGeneral = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-400" /> Nombre del Taller
          </label>
          <input required type="text" placeholder="Ej: Lubricentro Vespucio"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all text-zinc-800 focus:ring-2 focus:ring-zinc-200"
            value={formData.workshop_name} onChange={e => setFormData({ ...formData, workshop_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <Phone className="w-4 h-4 text-zinc-400" /> Teléfono
          </label>
          <input type="text" placeholder="+569 1234 5678"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all text-zinc-800 font-mono focus:ring-2 focus:ring-zinc-200"
            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-zinc-400" /> Dirección
          </label>
          <input type="text" placeholder="Av. Principal #123, Ciudad"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all text-zinc-800 focus:ring-2 focus:ring-zinc-200"
            value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-100">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-400" /> Plantilla de WhatsApp
          </label>
          <textarea rows={3} placeholder="Mensaje que se enviará a los clientes..."
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none transition-all text-zinc-800 resize-none focus:ring-2 focus:ring-zinc-200"
            value={formData.whatsapp_template} onChange={e => setFormData({ ...formData, whatsapp_template: e.target.value })} />
          <div className="flex gap-2 flex-wrap mt-2">
            <span className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded border border-zinc-200">Variables:</span>
            {['{{cliente}}', '{{vehiculo}}', '{{estado}}', '{{nombre_taller}}', '{{telefono_taller}}'].map(v => (
              <code key={v} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 rounded border border-zinc-200" style={{ color: formData.theme_menu_highlight }}>{v}</code>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderDesign = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-7 space-y-10">
        {/* Visual Identity */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-50 bg-zinc-50/30 flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm"><Building2 className="w-5 h-5 text-zinc-900" /></div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Identidad Visual</h3>
              <p className="text-[10px] text-zinc-500">Logotipo e Icono de Pestaña</p>
            </div>
          </div>
          <div className="p-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Logotipo (Menú)</label>
                <ImageUpload
                  bucket="garage-logos"
                  path={`logos/${settings?.company_id || 'default'}`}
                  currentImageUrl={formData.logo_url || ''}
                  onUploadComplete={url => setFormData(prev => ({ ...prev, logo_url: url }))}
                  className="h-40"
                />
                {formData.logo_url && (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="text-[9px] font-black text-zinc-400 uppercase">Escala</label>
                        <span className="text-[10px] font-mono font-bold text-zinc-600">{formData.logo_scale}x</span>
                      </div>
                      <input type="range" min="0.5" max="3" step="0.1" value={formData.logo_scale}
                        onChange={e => setFormData({ ...formData, logo_scale: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="text-[9px] font-black text-zinc-400 uppercase">Pos. Y</label>
                        <span className="text-[10px] font-mono font-bold text-zinc-600">{formData.logo_y_offset}px</span>
                      </div>
                      <input type="range" min="-50" max="50" step="1" value={formData.logo_y_offset}
                        onChange={e => setFormData({ ...formData, logo_y_offset: parseInt(e.target.value) })}
                        className="w-full h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900" />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Favicon (Navegador)</label>
                <ImageUpload
                  bucket="garage-logos"
                  path={`favicons/${settings?.company_id || 'default'}`}
                  currentImageUrl={formData.favicon_url || ''}
                  onUploadComplete={url => setFormData(prev => ({ ...prev, favicon_url: url }))}
                  className="h-40"
                />
                {formData.favicon_url && (
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center p-1.5">
                      <img src={formData.favicon_url} className="w-full h-full object-contain" alt="favicon" />
                    </div>
                    <p className="text-[9px] text-zinc-400 italic">Vista previa del icono en la pestaña del navegador.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Colors */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-50 bg-zinc-50/30 flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm"><Palette className="w-5 h-5 text-zinc-900" /></div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Colores del Menú</h3>
              <p className="text-[10px] text-zinc-500">Barra de navegación lateral</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <ColorPicker label="Fondo Sidebar" description="Color principal del menú"
              value={formData.theme_sidebar_bg || '#18181b'}
              onChange={v => setFormData({ ...formData, theme_sidebar_bg: v, theme_sidebar_active_bg: `${v}cc` })} />
            <ColorPicker label="Item Activo" description="Fondo del botón seleccionado"
              value={formData.theme_sidebar_active_bg || '#27272a'}
              onChange={v => setFormData({ ...formData, theme_sidebar_active_bg: v })} />
            <ColorPicker label="Texto Inactivo" description="Color de iconos y texto"
              value={formData.theme_menu_text || '#a1a1aa'}
              onChange={v => setFormData({ ...formData, theme_menu_text: v })} />
            <ColorPicker label="Texto Activo / Acento" description="Color al seleccionar"
              value={formData.theme_menu_highlight || '#f97316'}
              onChange={v => setFormData({ ...formData, theme_menu_highlight: v })} />
          </div>
        </div>

        {/* Interface Colors */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-50 bg-zinc-50/30 flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm"><LayoutIcon className="w-5 h-5 text-zinc-900" /></div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Colores de Interfaz</h3>
              <p className="text-[10px] text-zinc-500">Botones, fondos y cabecera</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <ColorPicker label="Botón Primario" description="Color de botones de acción"
              value={formData.theme_button_color || '#ea580c'}
              onChange={v => setFormData({ ...formData, theme_button_color: v })} />
            <ColorPicker label="Fondo General" description="Fondo de las páginas"
              value={formData.theme_main_bg || '#f4f4f5'}
              onChange={v => setFormData({ ...formData, theme_main_bg: v })} />
            <ColorPicker label="Fondo Cabecera" description="Barra superior"
              value={formData.theme_header_bg || '#ffffff'}
              onChange={v => setFormData({ ...formData, theme_header_bg: v })} />
            <ColorPicker label="Texto Cabecera" description="Títulos superiores"
              value={formData.theme_header_text || '#1f2937'}
              onChange={v => setFormData({ ...formData, theme_header_text: v })} />
            <ColorPicker label="Fondo Tarjetas" description="Recuadros de contenido"
              value={formData.theme_card_bg || '#ffffff'}
              onChange={v => setFormData({ ...formData, theme_card_bg: v })} />
            <ColorPicker label="Acento UI" description="Pequeños detalles visuales"
              value={formData.theme_accent_color || '#f97316'}
              onChange={v => setFormData({ ...formData, theme_accent_color: v })} />
          </div>

          {/* Presets */}
          <div className="p-6 pt-2 bg-zinc-50 border-t border-zinc-100/50">
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {[
                { name: 'Classic', primary: '#ea580c', highlight: '#f97316', sidebar: '#18181b', bg: '#f4f4f5' },
                { name: 'Emerald', primary: '#059669', highlight: '#10b981', sidebar: '#064e3b', bg: '#ecfdf5' },
                { name: 'Modern', primary: '#2563eb', highlight: '#3b82f6', sidebar: '#1e3a8a', bg: '#eff6ff' },
                { name: 'Midnight', primary: '#dc2626', highlight: '#f87171', sidebar: '#000000', bg: '#111827' },
              ].map((preset, i) => (
                <button key={i} type="button"
                  onClick={() => setFormData({ ...formData, theme_button_color: preset.primary, theme_menu_highlight: preset.highlight, theme_sidebar_bg: preset.sidebar, theme_sidebar_active_bg: `${preset.sidebar}cc`, theme_accent_color: preset.highlight, theme_main_bg: preset.bg })}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-900 transition-all active:scale-95 shadow-sm">
                  <div className="flex -space-x-1">
                    <div className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: preset.primary }} />
                    <div className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: preset.sidebar }} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slug */}
        <div className="space-y-4 pt-4 border-t border-zinc-100">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">URL Pública del Taller (Slug)</label>
          <input type="text" placeholder="mi-taller"
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none text-zinc-800 font-mono text-sm focus:ring-4 focus:ring-zinc-100"
            value={formData.company_slug}
            onChange={e => setFormData({ ...formData, company_slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
          {formData.company_slug && (
            <div className="p-5 rounded-3xl bg-zinc-900">
              <div className="flex items-center justify-between gap-4">
                <code className="text-[11px] break-all font-mono text-emerald-400 font-bold">
                  {window.location.host}/?t={formData.company_slug}
                </code>
                <button type="button"
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?t=${formData.company_slug}`); alert('¡Enlace copiado!'); }}
                  className="bg-white text-zinc-900 text-[10px] font-black uppercase px-4 py-2 rounded-xl shrink-0">
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="lg:col-span-5 relative">
        <DashboardPreview />
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-zinc-900">Gestión de Precios Dinámicos</h3>
        <p className="text-sm text-zinc-500 mt-1">Configura los precios de los servicios y vincúlalos a ítems del inventario.</p>
      </div>
      <div className="space-y-6">
        {(['oil_changes', 'brakes', 'tune_ups'] as const).map(category => {
          const labels: Record<string, string> = { oil_changes: 'Cambios de Aceite', brakes: 'Frenos', tune_ups: 'Afinamiento / Inspección' };
          const items = formData.pricing?.[category] || [];
          return (
            <div key={category} className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900">{labels[category]}</h4>
                <button type="button"
                  onClick={() => setFormData(prev => {
                    const pricing = { ...prev.pricing } as any;
                    pricing[category] = [...(pricing[category] || []), { id: crypto.randomUUID(), name: '', price: 0 }];
                    return { ...prev, pricing };
                  })}
                  className="text-xs px-3 py-1.5 bg-zinc-100 font-bold text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors">
                  + Agregar Servicio
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item: any, index: number) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 rounded-xl border border-zinc-100 bg-zinc-50/50">
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Inventario Vinculado</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none bg-white"
                        value={item.inventoryItemId || ''}
                        onChange={e => {
                          const newId = e.target.value;
                          const selectedPart = parts?.find(p => p.id === newId);
                          setFormData(prev => {
                            const pricing = { ...prev.pricing } as any;
                            const newItems = [...pricing[category]];
                            newItems[index] = { ...newItems[index], inventoryItemId: newId || null, price: selectedPart ? selectedPart.price : newItems[index].price, name: (!newItems[index].name && selectedPart) ? selectedPart.name : newItems[index].name };
                            pricing[category] = newItems;
                            return { ...prev, pricing };
                          });
                        }}>
                        <option value="">-- Manual --</option>
                        {parts?.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price.toLocaleString()})</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Nombre Público</label>
                      <input type="text" className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none bg-white"
                        placeholder="Nombre del servicio" value={item.name}
                        onChange={e => setFormData(prev => {
                          const pricing = { ...prev.pricing } as any;
                          const newItems = [...pricing[category]];
                          newItems[index] = { ...newItems[index], name: e.target.value };
                          pricing[category] = newItems;
                          return { ...prev, pricing };
                        })} />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Precio Final</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                        <input type="number" className="w-full pl-7 pr-3 py-2 rounded-lg border border-zinc-200 text-sm font-mono bg-white outline-none"
                          value={item.price}
                          onChange={e => setFormData(prev => {
                            const pricing = { ...prev.pricing } as any;
                            const newItems = [...pricing[category]];
                            newItems[index] = { ...newItems[index], price: parseInt(e.target.value) || 0 };
                            pricing[category] = newItems;
                            return { ...prev, pricing };
                          })} />
                      </div>
                    </div>
                    <div className="md:col-span-1 flex justify-center">
                      <button type="button"
                        onClick={() => setFormData(prev => {
                          const pricing = { ...prev.pricing } as any;
                          const newItems = [...pricing[category]];
                          newItems.splice(index, 1);
                          pricing[category] = newItems;
                          return { ...prev, pricing };
                        })}
                        className="w-9 h-9 rounded-xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center font-bold">
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="py-6 flex flex-col items-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <p className="text-sm font-medium text-zinc-500">No hay servicios.</p>
                    <p className="text-xs text-zinc-400">Haz clic en "+ Agregar Servicio".</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-zinc-900">Seguridad de la Cuenta</h3>
        <p className="text-sm text-zinc-500 mt-1">Gestiona contraseñas y permisos administrativos.</p>
      </div>

      {/* Password Change */}
      <div className="space-y-4 max-w-sm">
        <h4 className="font-semibold text-zinc-800">Cambiar Contraseña de Acceso</h4>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Nueva Contraseña</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={passwordData.new}
              onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-200 pr-10"
              placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Confirmar Contraseña</label>
          <input type={showPassword ? 'text' : 'password'} value={passwordData.confirm}
            onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-200"
            placeholder="Repite la contraseña" />
        </div>
        {passwordError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{passwordError}</p>}
        {passwordSaved && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium">¡Contraseña actualizada con éxito!</p>}
        <button type="button"
          disabled={passwordLoading || !passwordData.new || passwordData.new !== passwordData.confirm || passwordData.new.length < 6}
          onClick={async () => {
            setPasswordLoading(true);
            setPasswordError(null);
            try {
              const { error } = await supabase.auth.updateUser({ password: passwordData.new });
              if (error) throw error;
              setPasswordSaved(true);
              setPasswordData({ new: '', confirm: '' });
              setTimeout(() => setPasswordSaved(false), 3000);
            } catch (err: any) {
              setPasswordError(err.message || 'Error al actualizar la contraseña');
            } finally {
              setPasswordLoading(false);
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all disabled:opacity-50">
          {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
          Actualizar Contraseña
        </button>
      </div>

      {/* Admin Password */}
      <div className="space-y-4 max-w-sm pt-8 border-t border-zinc-100">
        <div>
          <h4 className="font-bold text-zinc-900 flex items-center gap-2"><Lock className="w-4 h-4" /> Contraseña de Borrado (Admin)</h4>
          <p className="text-sm text-zinc-500 mt-1">Clave maestra para autorizar operaciones sensibles como eliminar ventas.</p>
        </div>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={formData.admin_password || ''}
            onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-4 focus:ring-zinc-100 pr-10 font-mono"
            placeholder="Clave maestra..." />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 italic">Esta clave se solicitará en la Sala de Ventas al eliminar un registro.</p>
      </div>
    </div>
  );

  const renderExport = () => (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600">Exporta tus datos en formato Excel (.xlsx).</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileSpreadsheet className="w-6 h-6" /></div>
            <div>
              <h3 className="font-bold text-zinc-900">Tickets / Ordenes</h3>
              <p className="text-xs text-zinc-500">Historial completo de servicios y vehículos.</p>
            </div>
          </div>
          <button type="button" onClick={handleExportTickets}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-zinc-200 hover:border-blue-400 hover:text-blue-600 text-zinc-700 font-bold rounded-xl transition-all shadow-sm active:scale-95">
            <Download className="w-4 h-4" /> Exportar Tickets (.xlsx)
          </button>
        </div>
        <div className="p-6 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FileSpreadsheet className="w-6 h-6" /></div>
            <div>
              <h3 className="font-bold text-zinc-900">Inventario / Repuestos</h3>
              <p className="text-xs text-zinc-500">Listado de productos, stock y precios.</p>
            </div>
          </div>
          <button type="button" onClick={handleExportParts}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-zinc-200 hover:border-emerald-400 hover:text-emerald-600 text-zinc-700 font-bold rounded-xl transition-all shadow-sm active:scale-95">
            <Download className="w-4 h-4" /> Exportar Repuestos (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );

  const renderManual = () => (
    <OperationsManual themeColor={formData.theme_menu_highlight || '#f97316'} />
  );

  const renderExtension = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-zinc-900">Extensión del Sistema</h3>
        <p className="text-sm text-zinc-500 mt-1">Conecta y amplía las capacidades del sistema con módulos adicionales.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'Portal de Clientes', desc: 'Acceso web directo para consulta de estado de vehículos.', icon: '🌐', active: true },
          { title: 'API REST', desc: 'Integración con sistemas externos vía API.', icon: '🔌', active: false },
          { title: 'Reportes Avanzados', desc: 'Análisis profundo con gráficos y tendencias.', icon: '📊', active: false },
          { title: 'Notificaciones SMS', desc: 'Envío de alertas automáticas por SMS a clientes.', icon: '📱', active: false },
        ].map((ext, i) => (
          <div key={i} className={cn('p-6 rounded-2xl border space-y-3', ext.active ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-zinc-50 opacity-60')}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ext.icon}</span>
              <div>
                <h4 className="font-bold text-zinc-900">{ext.title}</h4>
                <p className="text-xs text-zinc-500">{ext.desc}</p>
              </div>
            </div>
            <div className={cn('text-xs font-bold px-2 py-1 rounded-full w-fit', ext.active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500')}>
              {ext.active ? '✓ Activo' : 'Próximamente'}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-400 text-sm flex items-center gap-3">
        <ExternalLink className="w-4 h-4 shrink-0" />
        <span>Para solicitar nuevas extensiones, contacta al administrador del sistema.</span>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneral();
      case 'design': return renderDesign();
      case 'pricing': return renderPricing();
      case 'security': return renderSecurity();
      case 'export': return renderExport();
      case 'manual': return renderManual();
      case 'extension': return renderExtension();
      default: return null;
    }
  };

  const showSaveButton = activeTab !== 'manual' && activeTab !== 'extension' && activeTab !== 'export';

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'design', label: 'Diseño', icon: <Palette className="w-4 h-4" /> },
    { id: 'pricing', label: 'Precios', icon: <CircleDollarSign className="w-4 h-4" /> },
    { id: 'security', label: 'Seguridad', icon: <Lock className="w-4 h-4" /> },
    { id: 'export', label: 'Exportar', icon: <Download className="w-4 h-4" /> },
    { id: 'manual', label: 'Manual', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'extension', label: 'Extensión', icon: <Puzzle className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
        <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2.5 uppercase tracking-tight italic">
          <Settings className="w-5 h-5 text-zinc-400" />
          Configuración <span className="text-zinc-400 font-normal">/ {activeTab}</span>
        </h2>
        <p className="text-zinc-500 text-sm mt-1">Personaliza la información del taller y las comunicaciones con los clientes.</p>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all whitespace-nowrap',
                activeTab === tab.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300')}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-4 md:p-8 w-full mx-auto', activeTab === 'design' ? 'max-w-6xl' : activeTab === 'manual' ? 'max-w-7xl' : 'max-w-3xl')}>
        <form onSubmit={handleSubmit} className="space-y-8">
          {renderTabContent()}

          {showSaveButton && (
            <div className="pt-6 flex items-center justify-between border-t border-zinc-100">
              {saved && (
                <span className="text-sm font-medium flex items-center gap-1.5 animate-in fade-in" style={{ color: formData.theme_menu_highlight }}>
                  <CheckCircle className="w-4 h-4" /> Guardado correctamente
                </span>
              )}
              <button type="submit" disabled={loading}
                className="ml-auto flex items-center gap-2 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
