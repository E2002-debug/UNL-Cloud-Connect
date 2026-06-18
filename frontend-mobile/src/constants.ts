import { Event } from './types';

export const MOCK_EVENTS: Event[] = [
  {
    id: 'fiavl-2026',
    title: 'Festival Internacional de Artes Vivas (FIAVL)',
    description: 'El evento cultural más grande del país. Teatro, danza y música en las calles de Loja.',
    category: 'festival',
    location: {
      lat: -3.9912,
      lng: -79.2023,
      name: 'Centro Histórico - Plaza de la Independencia'
    },
    date: '2026-11-15',
    attendeesCount: 1540,
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'feria-loja',
    title: '197 Feria de Loja',
    description: 'La feria más antigua de América. Comercio, cultura y tradición lojana.',
    category: 'fair',
    location: {
      lat: -3.9850,
      lng: -79.2010,
      name: 'Complejo Ferial Simón Bolívar'
    },
    date: '2026-09-01',
    attendeesCount: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=1200'
  }
];

export const SYSTEM_METRICS_MOCK = {
  activeUsers: 124,
  cpuLoad: 42,
  memoryUsage: 64,
  storageUsed: 15.4,
  storageUnit: 'GB',
  lastSync: Date.now()
};
