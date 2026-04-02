export interface ServiceFeature {
  name: string;
  included: boolean;
}

export interface LubriService {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  icon: string;
  features: string[];
}

export const LUBRIVESPUCIO_SERVICES: LubriService[] = [
  {
    id: 'aceite-motor',
    title: 'Cambio de Aceite de Motor',
    description: 'Servicio completo de lubricación para mantener el motor protegido y eficiente.',
    price: 'Desde $35.000',
    category: 'Aceites',
    icon: 'Droplet',
    features: [
      'Cambio de Aceite (Mineral, Semi o Sintético)',
      'Filtro de Aceite (según modelo)',
      'Revisión de Niveles (Frenos, Refrigerante, Dirección)',
      'Inspección Visual de Seguridad'
    ]
  },
  {
    id: 'aceite-transmision',
    title: 'Cambio de Aceite de Transmisión',
    description: 'Mantenimiento preventivo para la vida útil de tu caja de cambios.',
    price: 'Desde $45.000',
    category: 'Aceites',
    icon: 'Settings',
    features: [
      'Cambio de fluido de Transmisión Automática/Manual',
      'Revisión de fugas en cárter',
      'Prueba de suavidad en marchas'
    ]
  },
  {
    id: 'frenos',
    title: 'Servicio de Frenos',
    description: 'Revisión técnica y reemplazo de componentes para un frenado seguro.',
    price: 'Desde $25.000',
    category: 'Seguridad',
    icon: 'ShieldCheck',
    features: [
      'Revisión de Pastillas y Discos',
      'Limpieza y Ajuste de Frenos Traseros',
      'Relleno de Líquido de Frenos'
    ]
  },
  {
    id: 'filtros-aire',
    title: 'Cambio de Filtros (Aire y Polen)',
    description: 'Mejora la calidad del aire y el rendimiento del combustible.',
    price: 'Desde $12.000',
    category: 'Mantenimiento',
    icon: 'Wind',
    features: [
      'Filtro de Aire de Motor',
      'Filtro de Polen (Habitáculo)',
      'Limpieza de conductos de aire'
    ]
  },
  {
    id: 'scanner',
    title: 'Escáner Diagnóstico',
    description: 'Identificación precisa de fallas electrónicas y códigos de error.',
    price: 'Desde $20.000',
    category: 'Diagnóstico',
    icon: 'Cpu',
    features: [
      'Lectura de Códigos de Falla',
      'Borrado de Check Engine',
      'Informe Técnico Preventivo'
    ]
  }
];
