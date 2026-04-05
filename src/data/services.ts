import { LubriService } from "../types";

export const LUBRIgarage_SERVICES: LubriService[] = [
  {
    id: 'cambio-aceite-basico',
    title: 'CAMBIO DE ACEITE Y FILTRO ACEITE',
    description: 'Servicio esencial para la lubricación y protección del motor.',
    details: 'Incluye drenado de aceite usado, instalación de filtro de aceite nuevo y relleno con el lubricante seleccionado según especificaciones del fabricante.',
    price: 'Desde $29.000',
    category: 'Mantenimiento',
    icon: 'Droplet',
    image: '/assets/services/oil_change_premium.png',
    pricingTiers: [
      { label: '20W50', price: 29000 },
      { label: '15W40', price: 30000 },
      { label: '10W40 S', price: 32000 },
      { label: '10W40 SM', price: 35000 },
      { label: '5W30 SM', price: 46000 },
      { label: '5W30 SN', price: 52000 },
      { label: '5W30 DPF', price: 62000 },
    ],
    footerNote: 'VARIAN LOS PRECIOS SEGUN EL ACEITE Y FILTRO QUE REQUIERA SU VEHICULO.'
  },
  {
    id: 'cambio-aceite-completo',
    title: 'MANTENCIÓN DE ACEITE Y FILTROS COMPLETA',
    description: 'Servicio integral con todos los filtros y revisión de niveles.',
    details: 'Nuestro servicio más solicitado. Incluye cambio de aceite, filtro de aceite, filtro de aire y filtro de polen (si corresponde), además de una revisión técnica de niveles de fluidos.',
    price: 'Desde $49.000',
    category: 'Mantenimiento',
    icon: 'Settings',
    image: '/assets/services/full_maintenance_premium.png',
    pricingTiers: [
      { label: '20W50', price: 49000 },
      { label: '15W40', price: 50000 },
      { label: '10W40 S', price: 52000 },
      { label: '10W40 SM', price: 55000 },
      { label: '5W30 SM', price: 66000 },
      { label: '5W30 SN', price: 72000 },
      { label: '5W30 DPF', price: 82000 },
    ],
    footerNote: 'VARIAN LOS PRECIOS SEGUN EL ACEITE Y LOS FILTROS QUE REQUIERA SU VEHICULO.'
  },
  {
    id: 'pastillas-freno',
    title: 'CAMBIO PASTILLAS DE FRENO',
    description: 'Seguridad garantizada con el reemplazo de componentes de frenado.',
    details: 'Reemplazo de pastillas de freno delanteras o traseras. Incluye limpieza de componentes y revisión de estado de discos.',
    price: 'Desde $30.000',
    category: 'Seguridad',
    icon: 'ShieldCheck',
    image: '/assets/services/brake_pads_premium.png',
    footerNote: 'VARIAN LOS PRECIOS SEGUN LAS PASTILLAS QUE REQUIERA SU VEHICULO.'
  },
  {
    id: 'inspeccion-18-puntos',
    title: 'INSPECCIÓN O REPARACIÓN AUTOMOTRIZ',
    description: 'Revisión mecánica detallada de 18 puntos críticos.',
    details: 'Se entrega un informe detallado del estado de 18 puntos vitales del vehículo, incluyendo tren delantero, frenos, luces, niveles y estado general de piezas mecánicas.',
    price: 'Desde $35.000',
    category: 'Diagnóstico',
    icon: 'Scan',
    image: '/assets/services/inspection_premium.png',
    footerNote: 'PUEDE VARIAR SEGUN COMPLEJIDAD PARA ACCEDER A DICHAS PIEZAS O PARTES.'
  },
  {
    id: 'mantencion-preventiva',
    title: 'MANTENCIÓN PREVENTIVA',
    description: 'Mantenimiento programado según kilometraje (10k, 20k, 30k+).',
    details: 'Mantenimiento integral basado en las pautas de fabricante. Incluye inspección profunda, rotación de neumáticos y scanner diagnótico.',
    price: 'Consultar',
    category: 'Mantenimiento',
    icon: 'Clock',
    image: '/assets/services/preventive_premium.png',
    footerNote: 'EL PRECIO DEPENDE DEL KILOMETRAJE Y MODELO DEL VEHÍCULO.'
  }
];
