import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Loader2, CheckCircle2, X, ChevronLeft, ChevronRight,
  Layout, Star, MapPin, RefreshCw, Upload, Monitor
} from 'lucide-react';
import { GarageSettings, LandingPageConfig, LubriService } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import LandingPage from './LandingPage';
import { LUBRIgarage_SERVICES } from '../data/services';


interface LiveEditOverlayProps {
  cfg: LandingPageConfig;
  setCfg: (cfg: LandingPageConfig) => void;
  onUpdate: (updates: Partial<GarageSettings>) => Promise<void>;
  settings: GarageSettings | null;
  onClose: () => void;
}

const DEFAULTS: LandingPageConfig = {
  hero_badge: 'Calidad Certificada en Vespucio',
  hero_title: 'MANTÉN TU MOTOR AL 100%.',
  hero_subtitle: 'Especialistas en lubricación automotriz técnica.',
  hero_cta_text: 'Agendar Mi Filtro',
  hero_phone: '+56 9 9069 9021',
  hero_image_url: 'https://images.unsplash.com/photo-1486006396193-47101fd90ee7?q=80&w=1200',
  hero_stat1_value: '4.9/5',
  hero_stat1_label: 'Ranking Google',
  hero_stat2_value: '15min',
  hero_stat2_label: 'Cambio Express',
  hero_trust_text: 'Cientos de clientes confían su vehículo en Lubrivespucio cada mes.',
  hero_search_hint: 'Consulta el estado de tu cambio de aceite ahora',
  services_section_tag: 'Propuesta de Valor',
  services_section_title: 'Servicios de precisión técnica.',
  services_section_body: 'Cada servicio ejecutado con protocolos de fábrica.',
  location_tag: 'Dónde Estamos',
  location_title: 'Visítanos en Vespucio.',
  location_body: 'Ubicación estratégica para clientes de Maipú, Pudahuel y Cerrillos.',
  location_address: 'Av. Américo Vespucio 310, Maipú',
  location_hours_weekday: 'Lun - Vie: 09:30 - 19:00',
  location_hours_saturday: 'Sáb: 09:30 - 17:00',
  location_phone: '+56 9 9069 9021',
  location_maps_url: 'https://www.google.com/maps/search/?api=1&query=Av.+Americo+Vespucio+310,+Maipu',
  footer_copyright: '© 2026 Lubricentro Vespucio',
  header_logo_url: '',
};

type EditorTab = 'hero' | 'services' | 'location';

// ── Sub-components ──────────────────────────────────────────────────────────

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-zinc-500">{hint}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) => {
  const cls = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors resize-none";
  return multiline
    ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    : <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
};

const ImageUploader = ({ currentUrl, onUploaded, label }: { currentUrl: string; onUploaded: (url: string) => void; label: string }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(currentUrl); }, [currentUrl]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('landing-images').upload(filename, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('landing-images').getPublicUrl(data.path);
      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (e: any) {
      alert('Error al subir imagen: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      {preview && <img src={preview} alt="preview" className="w-full h-24 object-cover rounded-lg border border-zinc-700" />}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-zinc-700 hover:border-orange-500 text-xs text-zinc-400 hover:text-orange-400 transition-all disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploading ? 'Subiendo...' : 'Cambiar imagen'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <Input value={preview} onChange={v => { setPreview(v); onUploaded(v); }} placeholder="https://..." />
    </div>
  );
};

// ── Main Overlay ─────────────────────────────────────────────────────────────

export function LiveEditOverlay({ cfg, setCfg, onUpdate, settings, onClose }: LiveEditOverlayProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<EditorTab>('hero');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localCfg, setLocalCfg] = useState<LandingPageConfig>(cfg);
  const [localServices, setLocalServices] = useState<LubriService[]>(
    settings?.services_catalog && settings.services_catalog.length > 0
      ? settings.services_catalog
      : LUBRIgarage_SERVICES
  );

  // Sync live preview with local changes
  const setField = (key: keyof LandingPageConfig, value: string) => {
    setSaved(false);
    setLocalCfg(prev => ({ ...prev, [key]: value }));
  };

  const updateService = (idx: number, updates: Partial<LubriService>) => {
    setSaved(false);
    const newS = [...localServices];
    newS[idx] = { ...newS[idx], ...updates };
    setLocalServices(newS);
  };

  const merged = { ...DEFAULTS, ...localCfg };

  // Build a fake branding with the live config so LandingPage reflects edits immediately
  const liveBranding = settings ? { ...settings, landing_config: merged, services_catalog: localServices } : null;

  const handleSave = async () => {
    if (!settings?.id) { alert('No se encontró la configuración.'); return; }
    setSaving(true);
    try {
      await onUpdate({ landing_config: localCfg, services_catalog: localServices });
      setCfg(localCfg);        // propagate back to LandingEditor state
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Error al guardar: ' + (err?.message || 'desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: EditorTab; label: string; icon: React.ElementType }[] = [
    { id: 'hero', label: 'Hero', icon: Layout },
    { id: 'services', label: 'Servicios', icon: Star },
    { id: 'location', label: 'Contacto', icon: MapPin },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Preview pane wrapper ── */}
      <div
        className="flex-1 flex flex-col relative bg-[#070b14]"
        style={{ transition: 'all 0.3s ease' }}
      >
        {/* Top bar (Fixed inside the column) */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-black/80 backdrop-blur border-b border-zinc-800 z-[100000]">
          <Monitor className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Modo Edición en Vivo</span>
          <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full border border-orange-500/20 bg-orange-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[9px] font-black text-orange-400 uppercase">Live</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 disabled:opacity-50",
              saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
            )}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 transition-all border border-red-500/30"
          >
            <X className="w-3.5 h-3.5" />
            Cerrar Modo Edición
          </button>
          <button
            onClick={() => setPanelOpen(p => !p)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
            title={panelOpen ? 'Ocultar panel' : 'Mostrar panel'}
          >
            {panelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Actual LandingPage — all required props with safe stubs */}
        <div className="flex-1 overflow-y-auto relative">
          <LandingPage
            branding={liveBranding}
            onPortalAccess={() => {}}
            onAdminAccess={() => {}}
            onCustomerSearch={async () => {}}
            onOpenBooking={() => {}}
            fetchCompanies={async () => []}
            onAddReminder={async () => {}}
            fetchOccupied={async () => []}
            fetchVehicleInfo={async () => null}
            onLogin={async (_email: string, _pass: string) => ({ error: null })}
          />
        </div>

      </div>

      {/* ── Floating Edit Panel ── */}
      <div
        className={cn(
          "shrink-0 flex flex-col bg-zinc-950 border-l border-zinc-800 overflow-hidden transition-all duration-300",
          panelOpen ? "w-[340px]" : "w-0"
        )}
        style={{ minWidth: panelOpen ? 340 : 0 }}
      >
        {panelOpen && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
              <span className="text-xs font-black text-white uppercase tracking-widest">Panel de Edición</span>
              <button onClick={() => setPanelOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab nav */}
            <div className="flex border-b border-zinc-800 bg-zinc-900 px-3 gap-1 pt-2 shrink-0">
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-t-lg transition-all border-b-2",
                      activeTab === t.id
                        ? "text-orange-400 border-orange-500 bg-zinc-950"
                        : "text-zinc-500 border-transparent hover:text-zinc-300"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {activeTab === 'hero' && (
                <>
                  <Field label="Badge superior">
                    <Input value={merged.hero_badge!} onChange={v => setField('hero_badge', v)} placeholder={DEFAULTS.hero_badge} />
                  </Field>
                  <Field label="Título principal">
                    <Input value={merged.hero_title!} onChange={v => setField('hero_title', v)} placeholder={DEFAULTS.hero_title} multiline />
                  </Field>
                  <Field label="Subtítulo">
                    <Input value={merged.hero_subtitle!} onChange={v => setField('hero_subtitle', v)} placeholder={DEFAULTS.hero_subtitle} multiline />
                  </Field>
                  <Field label="Botón CTA">
                    <Input value={merged.hero_cta_text!} onChange={v => setField('hero_cta_text', v)} />
                  </Field>
                  <Field label="Teléfono Hero">
                    <Input value={merged.hero_phone!} onChange={v => setField('hero_phone', v)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Stat 1 Valor">
                      <Input value={merged.hero_stat1_value!} onChange={v => setField('hero_stat1_value', v)} />
                    </Field>
                    <Field label="Stat 1 Label">
                      <Input value={merged.hero_stat1_label!} onChange={v => setField('hero_stat1_label', v)} />
                    </Field>
                    <Field label="Stat 2 Valor">
                      <Input value={merged.hero_stat2_value!} onChange={v => setField('hero_stat2_value', v)} />
                    </Field>
                    <Field label="Stat 2 Label">
                      <Input value={merged.hero_stat2_label!} onChange={v => setField('hero_stat2_label', v)} />
                    </Field>
                  </div>
                  <Field label="Texto confianza">
                    <Input value={merged.hero_trust_text!} onChange={v => setField('hero_trust_text', v)} multiline />
                  </Field>
                  <Field label="Texto Buscador (Patente)">
                    <Input value={merged.hero_search_hint!} onChange={v => setField('hero_search_hint', v)} />
                  </Field>
                  <ImageUploader label="Logo (Header)" currentUrl={merged.header_logo_url || ''} onUploaded={url => setField('header_logo_url', url)} />
                  <ImageUploader
                    label="Imagen Hero"
                    currentUrl={merged.hero_image_url!}
                    onUploaded={url => setField('hero_image_url', url)}
                  />
                </>
              )}

              {activeTab === 'services' && (
                <>
                  <Field label="Etiqueta sección">
                    <Input value={merged.services_section_tag!} onChange={v => setField('services_section_tag', v)} />
                  </Field>
                  <Field label="Título sección">
                    <Input value={merged.services_section_title!} onChange={v => setField('services_section_title', v)} />
                  </Field>
                  <Field label="Descripción">
                    <Input value={merged.services_section_body!} onChange={v => setField('services_section_body', v)} multiline />
                  </Field>
                  <div className="mt-6 border-t border-zinc-800 pt-6 space-y-4">
                    <div className="flex items-center justify-between border-l-2 border-orange-500 pl-2">
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Catálogo de Servicios</span>
                      <button 
                        onClick={() => {
                          setLocalServices([...localServices, { id: `servicio_${Date.now()}`, title: 'Nuevo Servicio', description: '', price: 0, details: '', pricingTiers: [] }]);
                          setSaved(false);
                        }} 
                        className="text-[10px] text-zinc-400 hover:text-orange-400 font-bold uppercase transition-colors"
                      >
                        + Añadir Servicio
                      </button>
                    </div>
                    {localServices.map((service, idx) => (
                      <div key={service.id || idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-3 relative group">
                        <button 
                          onClick={() => {
                            if(confirm('¿Eliminar servicio?')) {
                              const newS = [...localServices];
                              newS.splice(idx, 1);
                              setLocalServices(newS);
                              setSaved(false);
                            }
                          }}
                          className="absolute top-3 right-3 text-zinc-600 hover:text-red-500 transition-colors"
                          title="Eliminar servicio"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-[10px] text-zinc-500 uppercase font-black">{service.id || `Servicio ${idx+1}`}</div>
                        <Field label="Título">
                          <Input value={service.title} onChange={v => updateService(idx, { title: v })} />
                        </Field>
                        <Field label="Descripción">
                          <Input value={service.description || ''} onChange={v => updateService(idx, { description: v })} multiline />
                        </Field>
                        <ImageUploader
                          label="Imagen Servicio"
                          currentUrl={service.image || ''}
                          onUploaded={url => updateService(idx, { image: url })}
                        />
                        <Field label="Detalles amplios">
                          <Input value={service.details || ''} onChange={v => updateService(idx, { details: v })} multiline />
                        </Field>
                        <Field label="Etiqueta Precio">
                          <Input value={service.price.toString()} onChange={v => updateService(idx, { price: v })} placeholder="Ej: Desde $29.000" />
                        </Field>
                        
                        {/* Tiers Editor */}
                        {service.pricingTiers && service.pricingTiers.length > 0 && (
                          <div className="pt-2 border-t border-zinc-800 space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Opciones / Precios</label>
                            {service.pricingTiers.map((tier, tIdx) => (
                              <div key={tIdx} className="flex gap-2">
                                <input 
                                  className="flex-1 min-w-0 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 outline-none" 
                                  value={tier.label}
                                  placeholder="Opción (ej. 10W40)"
                                  onChange={e => {
                                    const newTiers = [...service.pricingTiers!];
                                    newTiers[tIdx] = { ...newTiers[tIdx], label: e.target.value };
                                    updateService(idx, { pricingTiers: newTiers });
                                  }} 
                                />
                                <input 
                                  type="number" 
                                  className="w-24 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 outline-none" 
                                  value={tier.price} 
                                  placeholder="0"
                                  onChange={e => {
                                    const newTiers = [...service.pricingTiers!];
                                    newTiers[tIdx] = { ...newTiers[tIdx], price: Number(e.target.value) };
                                    updateService(idx, { pricingTiers: newTiers });
                                  }} 
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'location' && (
                <>
                  <Field label="Título contacto">
                    <Input value={merged.location_title!} onChange={v => setField('location_title', v)} />
                  </Field>
                  <Field label="Cuerpo texto">
                    <Input value={merged.location_body!} onChange={v => setField('location_body', v)} multiline />
                  </Field>
                  <Field label="Dirección">
                    <Input value={merged.location_address!} onChange={v => setField('location_address', v)} />
                  </Field>
                  <Field label="Horario semana">
                    <Input value={merged.location_hours_weekday!} onChange={v => setField('location_hours_weekday', v)} />
                  </Field>
                  <Field label="Horario sábado">
                    <Input value={merged.location_hours_saturday!} onChange={v => setField('location_hours_saturday', v)} />
                  </Field>
                  <Field label="Teléfono contacto">
                    <Input value={merged.location_phone!} onChange={v => setField('location_phone', v)} />
                  </Field>
                  <Field label="Copyright footer">
                    <Input value={merged.footer_copyright!} onChange={v => setField('footer_copyright', v)} />
                  </Field>
                  <div className="pt-4 border-t border-zinc-800 mt-2">
                    <ImageUploader
                      label="Imagen Ubicación"
                      currentUrl={merged.location_image_url || ''}
                      onUploaded={url => setField('location_image_url', url)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Save button bottom */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50",
                  saved ? "bg-green-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Guardando en BD...' : saved ? '¡Guardado! Vista actualizada' : 'Guardar Cambios'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
