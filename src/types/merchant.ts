export interface Merchant {
  id?: number;
  name: string;
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
}

export interface MerchantFormData {
  name: string;
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
