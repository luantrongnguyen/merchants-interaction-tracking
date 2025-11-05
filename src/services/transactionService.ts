import { CONFIG } from '../config';

interface TransactionResponse {
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
  data: Transaction[];
}

interface Transaction {
  Id: string;
  status: string;
  createAt: string;
  createBy: string;
  order: string;
  type: string;
  paymentNote: string;
  updateNote: string | null;
  amount: number;
  Card_id: string;
  bankName: string;
  cardNumber: string;
  responeText: string;
  invoice_date: string | null;
  noty: string | null;
  order_pending: boolean;
  CreateAtStr: string;
}

class TransactionService {
  /**
   * Chuyển đổi Store ID từ dạng S04314 sang A04314 (bỏ S, thay bằng A)
   */
  private convertStoreIdToCustomerCode(storeId: string): string {
    if (!storeId) return '';
    // Nếu bắt đầu bằng S, thay bằng A
    if (storeId.startsWith('S')) {
      return 'A' + storeId.substring(1);
    }
    return storeId;
  }

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

  /**
   * Gọi API để lấy transaction theo Store Code qua backend proxy
   */
  async getTransactionByStoreCode(storeId: string): Promise<TransactionResponse | null> {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    // Kiểm tra authentication trước khi gọi API
    const token = localStorage.getItem('auth_token');
    const isDevMode = process.env.REACT_APP_BYPASS_AUTH === 'true';
    if (!isDevMode && !token) {
      throw new Error('Vui lòng đăng nhập để truy cập dữ liệu.');
    }

    try {
      // Gọi API qua backend proxy để tránh vấn đề CORS và cookie
      const backendUrl = CONFIG.API_BASE_URL;
      
      const response = await fetch(`${backendUrl}/api/ims/transactions/${storeId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TransactionResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Parse date string từ CreateAtStr (format: "Oct 13, 2025 10:19 AM")
   * Chuyển đổi sang YYYY-MM-DD
   */
  parseCreateAtStr(createAtStr: string): string | null {
    if (!createAtStr) return null;
    
    try {
      // Parse date string như "Oct 13, 2025 10:19 AM"
      const date = new Date(createAtStr);
      if (isNaN(date.getTime())) {
        return null;
      }
      // Chuyển đổi sang YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  /**
   * So sánh hai date strings (YYYY-MM-DD)
   * Trả về true nếu date1 mới hơn date2
   */
  isDateNewer(date1: string, date2: string): boolean {
    if (!date1 || !date2) {
      console.log(`  ⚠️  Date comparison failed: date1=${date1}, date2=${date2}`);
      return false;
    }
    
    // Parse dates - handle different formats
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // If parsing failed, try alternative formats
    if (isNaN(d1.getTime())) {
      console.error(`  ❌ Invalid date1 format: ${date1}`);
      return false;
    }
    if (isNaN(d2.getTime())) {
      console.error(`  ❌ Invalid date2 format: ${date2}`);
      return false;
    }
    
    const result = d1.getTime() > d2.getTime();
    console.log(`  📊 Date comparison: ${date1} (${d1.getTime()}) > ${date2} (${d2.getTime()}) = ${result}`);
    return result;
  }

  /**
   * Lấy CreateAtStr từ transaction đầu tiên (nếu có)
   * Trả về date string YYYY-MM-DD hoặc null
   */
  getLatestTransactionDate(transactionResponse: TransactionResponse | null): string | null {
    if (!transactionResponse || !transactionResponse.data || transactionResponse.data.length === 0) {
      return null;
    }
    
    const firstTransaction = transactionResponse.data[0];
    return this.parseCreateAtStr(firstTransaction.CreateAtStr);
  }
}

const transactionService = new TransactionService();
export default transactionService;

