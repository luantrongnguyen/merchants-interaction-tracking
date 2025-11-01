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
  createdAt?: string;
  updatedAt?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  historyLogs?: HistoryLog[];
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
}

export type MerchantStatus = 'green' | 'orange' | 'red';

export interface MerchantWithStatus extends Merchant {
  status: MerchantStatus;
  daysSinceLastInteraction: number;
}
