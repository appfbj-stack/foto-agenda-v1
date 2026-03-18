
import { Client, Shoot, ShootStatus, PaymentStatus } from '../types';

const DB_NAME = 'FotoAgendaDB';
const DB_VERSION = 1;
const STORE_CLIENTS = 'clients';
const STORE_SHOOTS = 'shoots';

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
    date: new Date().toISOString().split('T')[0],
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
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
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
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
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

class DBService {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CLIENTS)) {
          db.createObjectStore(STORE_CLIENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SHOOTS)) {
          db.createObjectStore(STORE_SHOOTS, { keyPath: 'id' });
        }
      };
    });
  }

  async migrateFromLocalStorage() {
    const db = await this.open();
    const oldClients = localStorage.getItem('fotoagenda_clients');
    const oldShoots = localStorage.getItem('fotoagenda_shoots');

    if (oldClients) {
      const clients: Client[] = JSON.parse(oldClients);
      for (const c of clients) await this.saveClient(c);
      localStorage.removeItem('fotoagenda_clients');
    }

    if (oldShoots) {
      const shoots: Shoot[] = JSON.parse(oldShoots);
      for (const s of shoots) await this.saveShoot(s);
      localStorage.removeItem('fotoagenda_shoots');
    }
    
    // Check if seeded data is needed
    const currentClients = await this.getClients();
    if (currentClients.length === 0 && !oldClients) {
      for (const c of seedClients) await this.saveClient(c);
      for (const s of seedShoots) await this.saveShoot(s);
    }
  }

  async getClients(): Promise<Client[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CLIENTS, 'readonly');
      const store = transaction.objectStore(STORE_CLIENTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveClient(client: Client): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CLIENTS, 'readwrite');
      const store = transaction.objectStore(STORE_CLIENTS);
      const request = store.put(client);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteClient(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CLIENTS, 'readwrite');
      const store = transaction.objectStore(STORE_CLIENTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getShoots(): Promise<Shoot[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SHOOTS, 'readonly');
      const store = transaction.objectStore(STORE_SHOOTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveShoot(shoot: Shoot): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SHOOTS, 'readwrite');
      const store = transaction.objectStore(STORE_SHOOTS);
      const request = store.put(shoot);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteShoot(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SHOOTS, 'readwrite');
      const store = transaction.objectStore(STORE_SHOOTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageService = new DBService();
