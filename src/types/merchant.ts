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
  isMiUpdated?: boolean; // is_mi_updated từ cột O
  z11OrNotGoWMango?: boolean; // z11_or_not_go_w_mango từ cột P
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
  isMiUpdated?: boolean;
}

export type MerchantStatus = 'green' | 'orange' | 'red';

export interface MerchantWithStatus extends Merchant {
  status: MerchantStatus;
  daysSinceLastInteraction: number;
}
