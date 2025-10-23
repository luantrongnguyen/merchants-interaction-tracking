import { Merchant, MerchantFormData } from '../types/merchant';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_BASE_URL;

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getMerchants(): Promise<Merchant[]> {
    return this.request<Merchant[]>('/merchants');
  }

  async getMerchant(id: number): Promise<Merchant> {
    return this.request<Merchant>(`/merchants/${id}`);
  }

  async addMerchant(merchant: MerchantFormData): Promise<Merchant> {
    return this.request<Merchant>('/merchants', {
      method: 'POST',
      body: JSON.stringify(merchant),
    });
  }

  async updateMerchant(id: number, merchant: MerchantFormData): Promise<Merchant> {
    return this.request<Merchant>(`/merchants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(merchant),
    });
  }

  async deleteMerchant(id: number): Promise<void> {
    return this.request<void>(`/merchants/${id}`, {
      method: 'DELETE',
    });
  }
}

const apiService = new ApiService();
export default apiService;
