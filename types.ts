
export enum PaymentStatus {
  PENDING = 'Pendente',
  PARTIAL = 'Parcial',
  PAID = 'Pago',
}

export enum ShootStatus {
  SCHEDULED = 'Agendado',
  COMPLETED = 'Realizado',
  CANCELLED = 'Cancelado',
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  createdAt: number;
}

export interface Shoot {
  id: string;
  clientId: string; // Optional if isPersonal is true
  title: string; // e.g., "Ensaio Externo Gestante"
  isPersonal?: boolean; // New field to distinguish personal events
  packageType?: string; // Basic, Silver, etc
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  
  // New Production Fields
  makeupArtist?: string;
  makeupPrice?: number;
  hairstylist?: string;
  hairstylistPrice?: number;

  price: number;
  deposit: number; // Sinal
  paymentStatus: PaymentStatus;
  status: ShootStatus;
  notes?: string;
  reminderMinutes?: number; // Minutes before shoot to notify
  reminderSent?: boolean; // Track if notification was already sent
}

export type ViewState = 'dashboard' | 'calendar' | 'clients' | 'history';