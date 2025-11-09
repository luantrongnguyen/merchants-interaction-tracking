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
    
    // Kiểm tra authentication cho các endpoint không phải login/checkAuth
    const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/check';
    const token = localStorage.getItem('auth_token');
    
    if (!isDevMode && !isAuthEndpoint && !token) {
      throw new Error('Please log in to access data.');
    }
    
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
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your network connection.');
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

  async updateMerchant(id: number, merchant: MerchantFormData, updatedBy?: string): Promise<Merchant> {
    const body = updatedBy ? { ...merchant, updatedBy } : merchant;
    console.log(`📤 API Update Request:`, {
      id,
      url: `${API_BASE_URL}/merchants/${id}`,
      method: 'PATCH',
      body: JSON.stringify(body),
      updatedBy
    });
    
    try {
      const response = await this.request<Merchant>(`/merchants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      
      console.log(`📥 API Update Response:`, response);
      return response;
    } catch (error) {
      console.error(`❌ API Update Error:`, error);
      throw error;
    }
  }

  async deleteMerchant(id: number): Promise<void> {
    return this.request<void>(`/merchants/${id}`, {
      method: 'DELETE',
    });
  }

  async syncMerchants(): Promise<{ added: number; skipped: number; errors: number }> {
    return this.request<{ added: number; skipped: number; errors: number }>('/merchants/sync', {
      method: 'POST',
    });
  }

  async syncCallLogs(): Promise<{ matched: number; updated: number; errors: number; totalCallLogsAdded: number }> {
    return this.request<{ matched: number; updated: number; errors: number; totalCallLogsAdded: number }>('/merchants/sync-call-logs', {
      method: 'POST',
    });
  }

  async syncCallLogsManual(passcode: string): Promise<{ matched: number; updated: number; errors: number; totalCallLogsAdded: number }> {
    return this.request<{ matched: number; updated: number; errors: number; totalCallLogsAdded: number }>('/merchants/sync-call-logs-manual', {
      method: 'POST',
      body: JSON.stringify({ passcode }),
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

  async getAIInsight(question: string, merchants: any[], conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>) {
    // Backend will fetch merchant data itself, so we only send the question and conversation history
    const response = await this.request<{
      insight: string;
    }>('/ai/insight', {
      method: 'POST',
      body: JSON.stringify({ 
        question,
        conversationHistory: conversationHistory || [],
      }),
    });
    return response;
  }

  // Notes API
  async getNotes(): Promise<any[]> {
    return this.request<any[]>('/notes');
  }

  async createNote(title: string, content: string, noteDate?: string): Promise<any> {
    return this.request<any>('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content, noteDate }),
    });
  }

  async getUnreadNotesCount(): Promise<number> {
    const response = await this.request<{ count: number }>('/notes/unread-count');
    return response.count;
  }

  async markNoteAsRead(noteId: number): Promise<void> {
    await this.request(`/notes/${noteId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotesAsRead(): Promise<void> {
    await this.request('/notes/mark-all-read', {
      method: 'PATCH',
    });
  }

  async updateNote(noteId: number, title: string, content: string): Promise<any> {
    return this.request<any>(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
  }

  async deleteNote(noteId: number): Promise<void> {
    await this.request(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }
}

const apiService = new ApiService();
export default apiService;
