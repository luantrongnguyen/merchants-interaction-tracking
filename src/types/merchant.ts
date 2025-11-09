export interface HistoryLog {
  at: string; // ISO date or datetime
  by: string; // email
  data: {
    name: string;
    storeId?: string;
    address: string;
    street: string;
    area: string;
    state: string;
    zipcode: string;
    lastInteractionDate: string;
    platform: string;
    phone: string;
    lastModifiedAt?: string;
    lastModifiedBy?: string;
  };
}

export interface SupportLog {
  date: string;
  time: string;
  issue: string;
  category?: string;
  supporter: string;
}

export interface SupportNote {
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface Merchant {
  id?: number;
  name: string;
  storeId?: string; // ID dạng "S04314"
  address: string;
  street: string;
  area: string;
  state: string;
  zipcode: string;
  lastInteractionDate: string;
  platform: string;
  phone: string;
  supportNotes?: SupportNote[]; // Support notes list từ cột N (JSON array)
  createdAt?: string;
  updatedAt?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  historyLogs?: HistoryLog[];
  supportLogs?: SupportLog[];
}

export interface MerchantFormData {
  name: string;
  storeId?: string;
  address: string;
  street: string;
  area: string;
  state: string;
  zipcode: string;
  lastInteractionDate: string;
  platform: string;
  phone: string;
  supportNotes?: SupportNote[];
}

export type MerchantStatus = 'green' | 'orange' | 'red';

export interface MerchantWithStatus extends Merchant {
  status: MerchantStatus;
  daysSinceLastInteraction: number;
}
