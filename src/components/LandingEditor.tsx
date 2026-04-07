import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Save, Upload, Eye, Type, Image as ImageIcon, MapPin, ChevronRight,
  Loader2, CheckCircle2, Phone, Clock, Star, X, RefreshCw, Layout, Info,
  AlignLeft, Palette, Monitor, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';

import { GarageSettings, LandingPageConfig, LubriService } from '../types';
import { supabase, supabaseGarage, GARAGE_SCHEMA } from '../lib/supabase';
import { cn } from '../lib/utils';
import { LUBRIgarage_SERVICES } from '../data/services';

interface LandingEditorProps {
  settings: GarageSettings | null;
  onUpdate: (updates: Partial<GarageSettings>) => Promise<void>;
  onLiveEdit?: (cfg: LandingPageConfig, setCfg: (cfg: LandingPageConfig) => void, onUpdate: (updates: Partial<GarageSettings>) => Promise<void>, settings: GarageSettings | null) => void;
  onClose?: () => void;
}


type EditorTab = 'hero' | 'services' | 'location' | 'colores' | 'agenda';

const DEFAULTS: LandingPageConfig = {
  hero_badge: 'Calidad Certificada en Vespucio',
  hero_title: 'MANTÉN TU MOTOR AL 100%.',
  hero_subtitle: 'Especialistas en lubricación automotriz técnica. Tecnología de diagnóstico avanzada y los mejores aceites para prolongar la vida útil de tu vehículo.',
  hero_cta_text: 'Agendar Mi Filtro',
  hero_phone: '+56 9 9069 9021',
  hero_image_url: 'https://images.unsplash.com/photo-1632733711679-5292d667cdeb?q=80&w=1200',
  hero_stat1_value: '4.9/5',
  hero_stat1_label: 'Ranking Google',
  hero_stat2_value: '15min',
  hero_stat2_label: 'Cambio Express',
  hero_trust_text: 'Cientos de clientes confían su vehículo en Lubrivespucio cada mes.',
  hero_search_hint: 'Consulta el estado de tu cambio de aceite ahora',
  services_section_tag: 'Propuesta de Valor',
  services_section_title: 'Servicios de precisión técnica.',
  services_section_body: 'Cada servicio es ejecutado con protocolos de fábrica para asegurar la integridad de tu garantía automotriz.',
  location_tag: 'Dónde Estamos',
  location_title: 'Visítanos en Vespucio.',
  location_body: 'Ubicación estratégica para clientes de Maipú, Pudahuel y Cerrillos. Amplio estacionamiento y zona de espera VIP.',
  location_address: 'Av. Américo Vespucio 310, Maipú',
  location_hours_weekday: 'Lun - Vie: 09:30 - 19:00',
  location_hours_saturday: 'Sáb: 09:30 - 17:00',
  location_phone: '+56 9 9069 9021',
  location_maps_url: 'https://www.google.com/maps/search/?api=1&query=Av.+Americo+Vespucio+310,+Maipu',
  location_image_url: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=1200',
  footer_copyright: '© 2026 Lubricentro Vespucio',
  theme_primary_color: '#f97316',
  theme_secondary_color: '#3b82f6',
  theme_accent_color: '#f97316',
  theme_background_color: '#070b14',
  theme_text_color: '#ffffff',
  theme_border_radius: '3xl',
  agenda_slots_weekdays: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  agenda_slots_weekends: ['10:00', '11:00', '12:00', '13:00'],
};

// Simple field wrapper
const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) => {
  const cls = "w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors";
  return multiline
    ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    : <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
};

// Image uploader that uploads to Supabase Storage bucket "landing-images"
const ImageUploader = ({
  currentUrl, onUploaded, label
}: { currentUrl: string; onUploaded: (url: string) => void; label: string; }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(currentUrl); }, [currentUrl]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('landing-images')
        .upload(filename, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('landing-images')
        .getPublicUrl(data.path);

      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (err: any) {
      alert('Error al subir imagen (Asegúrate de crear el bucket "landing-images"): ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</label>
      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-zinc-700 aspect-video bg-zinc-900">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <button
            onClick={() => { setPreview(''); onUploaded(''); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-dashed border-zinc-600 hover:border-orange-500 text-zinc-400 hover:text-orange-400 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Subiendo...' : 'Subir imagen desde tu PC'}
      </button>
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">o URL</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      <Input
        value={preview}
        onChange={v => { setPreview(v); onUploaded(v); }}
        placeholder="https://..."
      />
    </div>
  );
};

// Multi-image uploader for gallery
const GalleryUploader = ({
  images = [], onUpdate, label
}: { images: string[]; onUpdate: (urls: string[]) => void; label: string; }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from('landing-images')
          .upload(filename, file, { upsert: true, contentType: file.type });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('landing-images')
          .getPublicUrl(data.path);
        newUrls.push(publicUrl);
      }
      onUpdate([...images, ...newUrls]);
    } catch (err: any) {
      alert('Error al subir imágenes: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    const next = [...images];
    next.splice(idx, 1);
    onUpdate(next);
  };

  return (
    <div className="space-y-4">
      <label className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative rounded-xl overflow-hidden border border-zinc-800 aspect-square bg-zinc-900 group">
            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(idx)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square flex flex-col items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border-2 border-dashed border-zinc-800 hover:border-orange-500/50 text-zinc-500 hover:text-orange-500 rounded-xl transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          <span className="text-[10px] font-black uppercase tracking-widest px-2 text-center">
            {uploading ? 'Subiendo...' : 'Añadir Fotos'}
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
      />
    </div>
  );
};

// ─── Live Preview Panel ──────────────────────────────────────────────────────
const LivePreview = ({ cfg }: { cfg: LandingPageConfig }) => {
  const c = { ...DEFAULTS, ...cfg };
  const accent = c.theme_accent_color || '#f97316';
  const bg = c.theme_background_color || '#070b14';

  return (
    <div className="w-full h-full overflow-y-auto font-sans text-[10px]" style={{ zoom: 0.55, backgroundColor: bg, color: 'white' }}>
      {/* Nav preview */}
      <div className="sticky top-0 backdrop-blur border-b border-white/5 px-6 py-3 flex items-center justify-between z-10" style={{ backgroundColor: `${bg}e6` }}>
        <div className="text-sm font-black uppercase tracking-widest" style={{ color: accent }}>Lubrivespucio</div>
        <div style={{ background: accent }} className="text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
          Acceso Taller
        </div>
      </div>

      {/* Hero */}
      <div className="px-8 pt-16 pb-10 grid grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            {c.hero_badge}
          </div>
          <h1 className="text-4xl font-black tracking-tighter leading-[0.95] whitespace-pre-line uppercase">
            {c.hero_title}
          </h1>
          <p className="text-slate-400 text-[11px] leading-relaxed">{c.hero_subtitle}</p>
          <div className="flex gap-3 pt-2">
            <div style={{ background: accent }} className="text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">{c.hero_cta_text}</div>
            <div className="border border-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">{c.hero_phone}</div>
          </div>
          <div className="flex gap-6 pt-3 border-t border-white/5">
            <div><p className="text-xl font-black">{c.hero_stat1_value}</p><p className="text-[8px] text-slate-500 uppercase tracking-widest">{c.hero_stat1_label}</p></div>
            <div className="w-px bg-white/10" />
            <div><p className="text-xl font-black">{c.hero_stat2_value}</p><p className="text-[8px] text-slate-500 uppercase tracking-widest">{c.hero_stat2_label}</p></div>
          </div>
        </div>

        {c.hero_image_url && (
          <div className="aspect-[4/5] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
            <img src={c.hero_image_url} alt="hero" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Services */}
      <div className="px-8 py-10 space-y-4">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent }}>{c.services_section_tag}</p>
        <h2 className="text-2xl font-black italic">{c.services_section_title}</h2>
        <p className="text-slate-400 text-[10px] max-w-xs">{c.services_section_body}</p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {['Cambio Aceite', 'Frenos', 'Inspección'].map(s => (
            <div key={s} className="p-4 rounded-[20px] bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl mb-3" style={{ background: `${accent}20` }} />
              <p className="text-[11px] font-black">{s}</p>
              <p className="text-[9px] text-zinc-500 mt-1">Desde $XX.XXX</p>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="px-8 py-10 border-t border-white/5 bg-white/5">
        <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: accent }}>{c.location_tag}</p>
        <h2 className="text-2xl font-black mb-3">{c.location_title}</h2>
        <p className="text-slate-400 text-[10px] mb-4">{c.location_body}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest mb-0.5">Dirección</p>
              <p className="text-[9px] text-slate-400">{c.location_address}</p>
            </div>
          </div>
          <div className="flex gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest mb-0.5">Horario</p>
              <p className="text-[9px] text-slate-400">{c.location_hours_weekday}</p>
              <p className="text-[9px] text-slate-400">{c.location_hours_saturday}</p>
            </div>
          </div>
        </div>
        {c.location_image_url && (
          <div className="mt-6 aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-xl">
            <img src={c.location_image_url} alt="location" className="w-full h-full object-cover" />
          </div>
        )}

        {c.gallery_images && c.gallery_images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {c.gallery_images.slice(0, 3).map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10">
                <img src={img} alt={`gallery-${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export function LandingEditor({ settings, onUpdate, onLiveEdit, onClose }: LandingEditorProps) {

  const [activeTab, setActiveTab] = useState<EditorTab>('hero');
  const [cfg, setCfg] = useState<LandingPageConfig>({});
  const [localServices, setLocalServices] = useState<LubriService[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize from settings
  useEffect(() => {
    if (settings?.landing_config) {
      setCfg(settings.landing_config);
    }
    if (settings?.services_catalog && settings.services_catalog.length > 0) {
      setLocalServices(settings.services_catalog);
    } else {
      setLocalServices(LUBRIgarage_SERVICES);
    }
  }, [settings?.id]);

  const setConfig = (key: keyof LandingPageConfig, value: string | string[]) => {
    setSaved(false);
    setCfg(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  const updateService = (idx: number, updates: Partial<LubriService>) => {
    setSaved(false);
    const newS = [...localServices];
    newS[idx] = { ...newS[idx], ...updates };
    setLocalServices(newS);
  };

  const handleSave = async () => {
    if (!settings?.id) {
      alert('No se encontró la configuración del taller. Recarga la página.');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      // Usamos onUpdate que internamente llama a updateSettings del hook
      // — el mismo camino que ya funciona para colores, precios, etc.
      await onUpdate({ landing_config: cfg, services_catalog: localServices });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Error saving landing config:', err);
      const msg = err?.message?.includes('Failed to fetch')
        ? 'Error de red. Verifica tu conexión y los permisos RLS en Supabase.'
        : (err?.message || 'Error desconocido');
      alert('No se pudo guardar: ' + msg);
    } finally {
      setSaving(false);
    }
  };


  const handleReset = () => {
    if (confirm('¿Restablecer esta sección a los valores por defecto?')) {
      const tabKeys: Record<EditorTab, (keyof LandingPageConfig)[]> = {
        hero: ['hero_badge', 'hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_phone', 'hero_image_url', 'hero_stat1_value', 'hero_stat1_label', 'hero_stat2_value', 'hero_stat2_label', 'hero_trust_text'],
        services: ['services_section_tag', 'services_section_title', 'services_section_body'],
        location: ['location_tag', 'location_title', 'location_body', 'location_address', 'location_hours_weekday', 'location_hours_saturday', 'location_phone', 'location_maps_url', 'footer_copyright', 'gallery_images'],
        colores: ['theme_primary_color', 'theme_secondary_color', 'theme_accent_color', 'theme_background_color', 'theme_text_color', 'theme_border_radius'],
        agenda: ['agenda_slots_weekdays', 'agenda_slots_weekends'],
      };
      const updates: Partial<LandingPageConfig> = {};
      tabKeys[activeTab].forEach(k => { (updates as any)[k] = (DEFAULTS as any)[k]; });
      setCfg(prev => ({ ...prev, ...updates }));
      setSaved(false);
    }
  };

  const merged = { ...DEFAULTS, ...cfg };

  const tabs: { id: EditorTab; label: string; icon: React.ElementType }[] = [
    { id: 'hero', label: 'Hero', icon: Layout },
    { id: 'services', label: 'Servicios', icon: Star },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'colores', label: 'Colores', icon: Palette },
    { id: 'agenda', label: 'Agenda', icon: Clock },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">Editor Landing Page</h1>
            <p className="text-[10px] text-zinc-500">Esquema: {GARAGE_SCHEMA}</p>
          </div>
        </div>
      <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:text-white rounded-lg hover:bg-red-500/20 transition-all border border-red-500/30 mx-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Salir del Editor
            </button>
          )}
          <button
            onClick={() => onLiveEdit?.(cfg, setCfg, onUpdate, settings)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 rounded-lg transition-all"
          >
            <Monitor className="w-3.5 h-3.5" />
            Editar en Vivo
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resetear
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50",
              saved
                ? "bg-green-500 text-white shadow-green-500/20"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Body: Editor */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 shrink-0 flex flex-col border-r border-zinc-800 overflow-hidden bg-zinc-950">
          {/* Tab nav */}
          <div className="flex border-b border-zinc-800 bg-zinc-900 px-4 gap-1 pt-2">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-t-lg transition-all border-b-2",
                    activeTab === t.id
                      ? "text-orange-400 border-orange-500 bg-zinc-950"
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'hero' && (
              <>
                <Field label="Badge / Etiqueta superior">
                  <Input value={merged.hero_badge!} onChange={v => setConfig('hero_badge', v)} placeholder={DEFAULTS.hero_badge} />
                </Field>

                <Field label="Título principal (MAYÚSCULAS)" hint="El estilo se mantiene automático.">
                  <Input value={merged.hero_title!} onChange={v => setConfig('hero_title', v)} placeholder={DEFAULTS.hero_title} multiline />
                </Field>

                <Field label="Subtítulo / descripción">
                  <Input value={merged.hero_subtitle!} onChange={v => setConfig('hero_subtitle', v)} placeholder={DEFAULTS.hero_subtitle} multiline />
                </Field>

                <Field label="Botón Agendar">
                  <Input value={merged.hero_cta_text!} onChange={v => setConfig('hero_cta_text', v)} placeholder={DEFAULTS.hero_cta_text} />
                </Field>

                <Field label="Teléfono Hero">
                  <Input value={merged.hero_phone!} onChange={v => setConfig('hero_phone', v)} placeholder={DEFAULTS.hero_phone} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ranking VAL">
                    <Input value={merged.hero_stat1_value!} onChange={v => setConfig('hero_stat1_value', v)} />
                  </Field>
                  <Field label="Ranking ETI">
                    <Input value={merged.hero_stat1_label!} onChange={v => setConfig('hero_stat1_label', v)} />
                  </Field>
                </div>

                <Field label="Texto de confianza">
                  <Input value={merged.hero_trust_text!} onChange={v => setConfig('hero_trust_text', v)} multiline />
                </Field>
                <Field label="Hint de buscador (Patente)">
                  <Input value={merged.hero_search_hint!} onChange={v => setConfig('hero_search_hint', v)} />
                </Field>

                <ImageUploader
                  label="Logo de la Página (Header)"
                  currentUrl={merged.header_logo_url || ''}
                  onUploaded={url => setConfig('header_logo_url', url)}
                />

                <ImageUploader
                  label="Imagen Principal (Hero)"
                  currentUrl={merged.hero_image_url!}
                  onUploaded={url => setConfig('hero_image_url', url)}
                />
              </>
            )}

            {activeTab === 'services' && (
              <>
                <Field label="Etiqueta sección">
                  <Input value={merged.services_section_tag!} onChange={v => setConfig('services_section_tag', v)} />
                </Field>
                <Field label="Título sección">
                  <Input value={merged.services_section_title!} onChange={v => setConfig('services_section_title', v)} />
                </Field>
                <Field label="Descripción">
                  <Input value={merged.services_section_body!} onChange={v => setConfig('services_section_body', v)} multiline />
                </Field>

                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase text-zinc-400">Catálogo de Servicios</h3>
                    <button 
                      onClick={() => {
                        setLocalServices([...localServices, { id: `servicio_${Date.now()}`, title: 'Nuevo Servicio', description: '', price: '0', details: '', pricingTiers: [], show_from_price: false }]);
                        setSaved(false);
                      }} 
                      className="text-xs text-zinc-400 hover:text-orange-400 font-bold uppercase transition-colors"
                    >
                      + Añadir Servicio
                    </button>
                  </div>
                  {localServices.map((svc, sIdx) => (
                    <div key={sIdx} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/10">Servicio #{sIdx + 1}</span>
                        <button
                          onClick={() => {
                            const newS = [...localServices];
                            newS.splice(sIdx, 1);
                            setLocalServices(newS);
                            setSaved(false);
                          }}
                          className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
                          title="Eliminar servicio"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nombre Servicio">
                          <Input value={svc.title} onChange={v => updateService(sIdx, { title: v })} />
                        </Field>
                        <Field label="Categoría">
                          <Input value={svc.category || ''} onChange={v => updateService(sIdx, { category: v })} />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Precio Público (Texto)" hint="Ej: $45.000">
                          <Input value={svc.price || ''} onChange={v => updateService(sIdx, { price: v })} />
                        </Field>
                        <div className="flex items-end pb-1.5">
                          <label className="flex items-center gap-3 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-700 transition-all w-full">
                            <input
                              type="checkbox"
                              checked={svc.show_from_price}
                              onChange={(e) => updateService(sIdx, { show_from_price: e.target.checked })}
                              className="w-5 h-5 rounded-lg border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Mostrar "Desde"</span>
                          </label>
                        </div>
                      </div>

                      <Field label="Descripción Corta">
                        <Input value={svc.description} onChange={v => updateService(sIdx, { description: v })} multiline />
                      </Field>

                      <ImageUploader
                        label="Imagen del Servicio"
                        currentUrl={svc.image || ''}
                        onUploaded={url => updateService(sIdx, { image: url })}
                      />

                      <Field label="Detalles (Modal)">
                        <Input value={svc.details || ''} onChange={v => updateService(sIdx, { details: v })} multiline />
                      </Field>
                      
                      {/* Tiers */}
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-widest">Precios / Variantes del Detalle</label>
                          <button 
                            onClick={() => {
                              const newTiers = [...(svc.pricingTiers || []), { label: 'Nueva Variante', price: 0 }];
                              updateService(sIdx, { pricingTiers: newTiers });
                            }}
                            className="text-[9px] font-black uppercase text-orange-500 hover:text-orange-400 transition-colors"
                          >
                            + Añadir Variante
                          </button>
                        </div>
                        
                        {(svc.pricingTiers || []).length === 0 && (
                          <p className="text-[10px] text-zinc-600 italic">No hay variantes definidas para el detalle del servicio.</p>
                        )}

                        {svc.pricingTiers?.map((t, tIdx) => (
                          <div key={tIdx} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg group/tier">
                            <input
                              value={t.label}
                              onChange={e => {
                                const newTiers = [...(svc.pricingTiers || [])];
                                newTiers[tIdx].label = e.target.value;
                                updateService(sIdx, { pricingTiers: newTiers });
                              }}
                              className="flex-1 bg-transparent text-xs text-white border border-white/10 rounded px-2 py-1 outline-none focus:border-orange-500 font-bold"
                              placeholder="Ej: 10W40"
                            />
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1.5 text-xs text-zinc-500">$</span>
                              <input
                                type="number"
                                value={t.price}
                                onChange={e => {
                                  const newTiers = [...(svc.pricingTiers || [])];
                                  newTiers[tIdx].price = parseInt(e.target.value) || 0;
                                  updateService(sIdx, { pricingTiers: newTiers });
                                }}
                                className="w-full pl-5 pr-2 py-1 bg-transparent text-xs text-white font-bold border border-white/10 rounded outline-none focus:border-orange-500 text-right"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const newTiers = svc.pricingTiers?.filter((_, i) => i !== tIdx);
                                updateService(sIdx, { pricingTiers: newTiers });
                              }}
                              className="p-1 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover/tier:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'location' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Etiqueta Sección">
                    <Input value={merged.location_tag!} onChange={v => setConfig('location_tag', v)} />
                  </Field>
                  <Field label="Título Sección">
                    <Input value={merged.location_title!} onChange={v => setConfig('location_title', v)} />
                  </Field>
                </div>

                <Field label="Descripción de ubicación">
                  <Input value={merged.location_body!} onChange={v => setConfig('location_body', v)} multiline />
                </Field>

                <Field label="Dirección Física">
                  <Input value={merged.location_address!} onChange={v => setConfig('location_address', v)} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Horario Lunes-Viernes">
                    <Input value={merged.location_hours_weekday!} onChange={v => setConfig('location_hours_weekday', v)} />
                  </Field>
                  <Field label="Horario Sábado">
                    <Input value={merged.location_hours_saturday!} onChange={v => setConfig('location_hours_saturday', v)} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Teléfono / Contacto">
                    <Input value={merged.location_phone!} onChange={v => setConfig('location_phone', v)} />
                  </Field>
                  <Field label="URL Google Maps (Compartir)">
                    <Input value={merged.location_maps_url!} onChange={v => setConfig('location_maps_url', v)} />
                  </Field>
                </div>

                <Field label="Copyright (Footer)">
                  <Input value={merged.footer_copyright!} onChange={v => setConfig('footer_copyright', v)} />
                </Field>

                <div className="pt-6 border-t border-zinc-800 space-y-8">
                  <ImageUploader
                    label="Foto Principal Portada"
                    currentUrl={merged.location_image_url || ''}
                    onUploaded={url => setConfig('location_image_url', url)}
                  />
                  
                  <GalleryUploader
                    label="Galería de Fotos del Taller"
                    images={merged.gallery_images || []}
                    onUpdate={urls => setConfig('gallery_images', urls)}
                  />

                  <p className="mt-2 text-[10px] text-zinc-500">
                    Sube fotos reales del taller, equipo y trabajos realizados para generar confianza.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'colores' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-6">
                  <Field label="Color Primario" hint="Botones, iconos y resaltados">
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        value={merged.theme_primary_color} 
                        onChange={e => setConfig('theme_primary_color', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={merged.theme_primary_color} 
                        onChange={e => setConfig('theme_primary_color', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </Field>

                  <Field label="Color Secundario" hint="Degradados y hover">
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        value={merged.theme_secondary_color} 
                        onChange={e => setConfig('theme_secondary_color', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={merged.theme_secondary_color} 
                        onChange={e => setConfig('theme_secondary_color', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Field label="Color de Acento" hint="Badge y elementos secundarios">
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        value={merged.theme_accent_color} 
                        onChange={e => setConfig('theme_accent_color', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={merged.theme_accent_color} 
                        onChange={e => setConfig('theme_accent_color', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </Field>

                  <Field label="Color de Texto" hint="Títulos y párrafos principales">
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        value={merged.theme_text_color} 
                        onChange={e => setConfig('theme_text_color', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={merged.theme_text_color} 
                        onChange={e => setConfig('theme_text_color', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Field label="Color de Fondo" hint="Color base de toda la página">
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        value={merged.theme_background_color} 
                        onChange={e => setConfig('theme_background_color', e.target.value)}
                        className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={merged.theme_background_color} 
                        onChange={e => setConfig('theme_background_color', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </Field>

                  <Field label="Redondeo de Bordes" hint="Estilo visual de tarjetas y botones">
                    <select 
                      value={merged.theme_border_radius}
                      onChange={e => setConfig('theme_border_radius', e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white outline-none focus:border-orange-500 appearance-none cursor-pointer"
                    >
                      <option value="none">Ninguno (Recto)</option>
                      <option value="sm">Pequeño</option>
                      <option value="md">Medio</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Extra Grande</option>
                      <option value="2xl">2XL</option>
                      <option value="3xl">3XL (Moderno)</option>
                      <option value="full">Completamente Redondo</option>
                    </select>
                  </Field>
                </div>

                <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex gap-4">
                  <Palette className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Personaliza los colores para que coincidan con la marca del taller. Estos cambios se reflejarán instantáneamente en la vista previa a la derecha.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex gap-4">
                  <Info className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Configura los bloques horarios disponibles para el agendamiento público. 
                    Separa las horas con comas (ej: 09:00, 10:30, 15:00).
                  </p>
                </div>

                <Field 
                  label="Horas Disponibles (Lunes a Viernes)" 
                  hint="Ej: 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00"
                >
                  <Input 
                    value={(merged.agenda_slots_weekdays || []).join(', ')} 
                    onChange={v => setConfig('agenda_slots_weekdays', v.split(',').map(s => s.trim()).filter(Boolean))} 
                    placeholder="10:00, 11:00..."
                    multiline
                  />
                </Field>

                <Field 
                  label="Horas Disponibles (Sábados)" 
                  hint="Días de fin de semana (Sábados/Domingos). Ej: 10:00, 11:00, 12:00, 13:00"
                >
                  <Input 
                    value={(merged.agenda_slots_weekends || []).join(', ')} 
                    onChange={v => setConfig('agenda_slots_weekends', v.split(',').map(s => s.trim()).filter(Boolean))} 
                    placeholder="10:00, 11:00..."
                    multiline
                  />
                </Field>

                <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex gap-4">
                  <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Los clientes verán estas opciones según el día que seleccionen en el calendario. 
                    Si no configuras nada, se usarán los horarios por defecto (10:00 a 17:00).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="hidden lg:block w-[700px] shrink-0 h-full overflow-hidden bg-black p-6">
          <div className="w-full h-full rounded-[40px] overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-900">
            <div className="absolute inset-x-0 top-0 h-8 flex items-center justify-center gap-1.5 z-20 bg-zinc-900/50">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/20" />
            </div>
            <div className="w-full h-full pt-8">
              <LivePreview cfg={cfg} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
