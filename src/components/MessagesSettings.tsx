import React, { useState, useEffect } from 'react';
import { GarageSettings, Ticket } from '../types';
import { MessageSquare, Save, Info, Copy, Check, Send, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface MessagesSettingsProps {
  settings: GarageSettings | null;
  onUpdate: (updates: Partial<GarageSettings>) => Promise<void>;
  tickets: Ticket[];
}

export function MessagesSettings({ settings, onUpdate, tickets }: MessagesSettingsProps) {
  const [template, setTemplate] = useState(settings?.whatsapp_template || '');
  const [quotationTemplate, setQuotationTemplate] = useState(() => {
    return localStorage.getItem('garage_quotation_template') || 
      'Hola {{cliente}}, ya tenemos los resultados de la inspección técnica de {{vehiculo}}.\n\nEl total de su cotización es {{total}}.\nPuede ver el detalle completo, fotos de ingreso, fotos de inspección y confirmar su presupuesto aquí: {{link_portal}}';
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<'standard' | 'quotation'>('standard');

  useEffect(() => {
    if (settings?.whatsapp_template) {
      setTemplate(settings.whatsapp_template);
    }
  }, [settings?.whatsapp_template]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ whatsapp_template: template });
      localStorage.setItem('garage_quotation_template', quotationTemplate);
      // In a real scenario, we'd add 'whatsapp_quotation_template' to the DB schema
      alert('Configuraciones de mensajes guardadas correctamente.');
    } catch (error) {
      console.error('Error saving message settings:', error);
      alert('Error al guardar las configuraciones.');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const variables = [
    { name: '{{cliente}}', desc: 'Nombre del dueño' },
    { name: '{{vehiculo}}', desc: 'Modelo del vehículo' },
    { name: '{{patente}}', desc: 'Placa patente' },
    { name: '{{estado}}', desc: 'Estado actual (Ingreso, En espera, etc.)' },
    { name: '{{nombre_taller}}', desc: 'Nombre de tu taller' },
    { name: '{{telefono_taller}}', desc: 'Teléfono de contacto' },
    { name: '{{total}}', desc: 'Monto total (solo cotización)' },
    { name: '{{link_portal}}', desc: 'Link al portal del cliente' },
  ];

  const getPreviewMessage = (tpl: string, isQuotation = false) => {
    const sampleTicket = tickets[0] || {
      owner_name: 'Juan Pérez',
      model: 'Toyota Hilux 2022',
      patente: 'ABCD-12',
      status: 'Listo para entrega',
      quotation_total: 150000
    };

    let msg = tpl
      .replace(/{{cliente}}/g, sampleTicket.owner_name)
      .replace(/{{vehiculo}}/g, sampleTicket.model)
      .replace(/{{patente}}/g, sampleTicket.patente || '')
      .replace(/{{estado}}/g, 'listo para recoger')
      .replace(/{{nombre_taller}}/g, settings?.workshop_name || 'Mi Taller')
      .replace(/{{telefono_taller}}/g, settings?.phone || '+569 1234 5678')
      .replace(/{{total}}/g, `$${(150000).toLocaleString('es-CL')}`)
      .replace(/{{link_portal}}/g, `${window.location.origin}/?t=${settings?.company_slug || 'consulta'}&p=${sampleTicket.patente || ''}`);

    return msg;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <MessageSquare className="w-8 h-8" />
          </div>
          Configuración de Mensajes
        </h2>
        <p className="text-zinc-500 font-medium ml-1">Personaliza las plantillas de WhatsApp para tus clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Standard Template */}
          <section className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                <h3 className="font-bold text-zinc-800">Plantilla Estándar (Aviso de Entrega)</h3>
              </div>
              <button 
                onClick={() => setActivePreview('standard')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all",
                  activePreview === 'standard' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Vista Previa
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full h-32 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-300 resize-none mb-4"
                placeholder="Hola {{cliente}}, tu {{vehiculo}} ya está..."
              />
            </div>
          </section>

          {/* Quotation Template */}
          <section className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="font-bold text-zinc-800">Plantilla de Cotización</h3>
              </div>
              <button 
                onClick={() => setActivePreview('quotation')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all",
                  activePreview === 'quotation' ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                Vista Previa
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={quotationTemplate}
                onChange={(e) => setQuotationTemplate(e.target.value)}
                className="w-full h-40 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-zinc-700 placeholder:text-zinc-300 resize-none"
                placeholder="Hola {{cliente}}, ya tenemos los resultados..."
              />
              <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 font-medium italic">
                  Esta plantilla es provisoria y se guarda localmente hasta que se habilite el campo en la base de datos oficial.
                </p>
              </div>
            </div>
          </section>

          {/* Variables Reference */}
          <div className="bg-zinc-900 rounded-3xl p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Copy className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative">
              <h4 className="font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Variables Disponibles
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {variables.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => copyToClipboard(v.name, v.name)}
                    className="group bg-zinc-800/50 hover:bg-zinc-800 p-2.5 rounded-xl border border-zinc-700/50 transition-all text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-black font-mono text-zinc-300 group-hover:text-emerald-400 transition-colors">{v.name}</div>
                      <div className="text-[9px] text-zinc-500 font-medium">{v.desc}</div>
                    </div>
                    {copied === v.name ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-opacity" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="space-y-6">
          <div className="sticky top-8">
            <div className="bg-[#E5DDD5] rounded-[2.5rem] p-4 shadow-2xl border-8 border-zinc-900 aspect-[9/16] relative overflow-hidden flex flex-col">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] p-3 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-zinc-300 flex items-center justify-center font-bold text-zinc-600 text-xs">JP</div>
                <div className="flex-1">
                  <div className="text-white text-xs font-bold">Cliente (Preview)</div>
                  <div className="text-emerald-200 text-[10px]">en línea</div>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] relative animate-in zoom-in-95 duration-300">
                  <div className="text-[11px] text-zinc-800 whitespace-pre-wrap leading-tight">
                    {getPreviewMessage(activePreview === 'standard' ? template : quotationTemplate)}
                  </div>
                  <div className="text-[9px] text-zinc-400 text-right mt-1">12:45 PM</div>
                  {/* Bubble tail */}
                  <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="bg-zinc-100 p-2 flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full h-8 px-4 flex items-center text-zinc-300 italic text-[10px]">
                  Escribe un mensaje...
                </div>
                <div className="w-8 h-8 bg-[#128C7E] rounded-full flex items-center justify-center text-white">
                  <Send className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3",
                  saving ? "bg-zinc-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                )}
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-800 font-bold leading-tight">
                  Recuerda usar las variables entre llaves dobles. Ejemplo: <code>{'{{cliente}}'}</code>.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[10px] text-blue-800 font-bold leading-tight uppercase tracking-tighter">
                  ¡Novedad! El link del portal ahora entra directo a la patente del cliente. Ya no necesitan buscarla manualmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
