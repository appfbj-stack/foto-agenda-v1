
import { Client, Shoot, ShootStatus, PaymentStatus } from '../types';

const CLIENTS_KEY = 'fotoagenda_clients';
const SHOOTS_KEY = 'fotoagenda_shoots';

// Seed data for initial experience
const seedClients: Client[] = [
  { id: 'c1', name: 'Ana Silva', phone: '(11) 99999-9999', email: 'ana@email.com', createdAt: Date.now(), notes: 'Prefere fotos espontâneas' },
  { id: 'c2', name: 'Carlos Oliveira', phone: '(21) 98888-8888', email: 'carlos@email.com', createdAt: Date.now() },
];

const seedShoots: Shoot[] = [
  {
    id: 's1',
    clientId: 'c1',
    title: 'Ensaio Gestante - Parque',
    isPersonal: false,
    packageType: 'Gold',
    date: new Date().toISOString().split('T')[0], // Today
    time: '15:00',
    location: 'Parque Ibirapuera',
    makeupArtist: 'Julia Beauty',
    makeupPrice: 200,
    price: 500,
    deposit: 150,
    paymentStatus: PaymentStatus.PARTIAL,
    status: ShootStatus.SCHEDULED,
    notes: 'Levar rebatedor dourado',
    reminderMinutes: 60,
    reminderSent: false
  },
  {
    id: 's2',
    clientId: 'c2',
    title: 'Retratos Corporativos',
    isPersonal: false,
    packageType: 'Básico',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days later
    time: '10:00',
    location: 'Escritório Av. Paulista',
    price: 800,
    deposit: 800,
    paymentStatus: PaymentStatus.PAID,
    status: ShootStatus.SCHEDULED,
    reminderMinutes: 0,
    reminderSent: false
  },
  {
    id: 's3',
    clientId: 'personal',
    title: 'Consulta Médica',
    isPersonal: true,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: '08:00',
    location: 'Clínica Central',
    price: 0,
    deposit: 0,
    paymentStatus: PaymentStatus.PAID,
    status: ShootStatus.SCHEDULED,
    reminderMinutes: 30,
    reminderSent: false
  }
];

export const storageService = {
  getClients: (): Client[] => {
    const data = localStorage.getItem(CLIENTS_KEY);
    if (!data) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(seedClients));
      return seedClients;
    }
    return JSON.parse(data);
  },

  saveClient: (client: Client): void => {
    const clients = storageService.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  deleteClient: (id: string): void => {
    const clients = storageService.getClients().filter(c => c.id !== id);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  getShoots: (): Shoot[] => {
    const data = localStorage.getItem(SHOOTS_KEY);
    if (!data) {
      localStorage.setItem(SHOOTS_KEY, JSON.stringify(seedShoots));
      return seedShoots;
    }
    return JSON.parse(data);
  },

  saveShoot: (shoot: Shoot): void => {
    const shoots = storageService.getShoots();
    const index = shoots.findIndex(s => s.id === shoot.id);
    if (index >= 0) {
      shoots[index] = shoot;
    } else {
      shoots.push(shoot);
    }
    localStorage.setItem(SHOOTS_KEY, JSON.stringify(shoots));
  },

  deleteShoot: (id: string): void => {
    const shoots = storageService.getShoots().filter(s => s.id !== id);
    localStorage.setItem(SHOOTS_KEY, JSON.stringify(shoots));
  }
};