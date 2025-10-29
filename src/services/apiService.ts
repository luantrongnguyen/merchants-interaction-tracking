import { Merchant, MerchantFormData } from '../types/merchant';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.API_BASE_URL;

interface User {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  isAuthenticated?: boolean;
  access_token?: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Disable cache in dev mode
    const isDevMode = process.env.REACT_APP_BYPASS_AUTH === 'true';
    const cacheOption = isDevMode ? { cache: 'no-cache' as RequestCache } : {};
    
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...(isDevMode && {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }),
        ...options.headers,
      },
      mode: 'cors', // Enable CORS
      ...cacheOption,
      ...options,
    };

    // Add timestamp to prevent cache in dev mode
    const urlWithTimestamp = isDevMode && !endpoint.includes('?') 
      ? `${url}?_t=${Date.now()}` 
      : url;

    try {
      const response = await fetch(urlWithTimestamp, requestOptions);

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - clear auth token and redirect to login
          localStorage.removeItem('auth_token');
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      }
      throw error;
    }
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

  // Authentication methods
  async login(user: User): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
    
    if (response.success && response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async checkAuth(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/check');
  }
}

const apiService = new ApiService();
export default apiService;
