import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/apiService';

interface User {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const bypassAuth = process.env.REACT_APP_BYPASS_AUTH === 'true';
  
  // Khởi tạo state dựa trên việc có token hay không để tránh loading không cần thiết
  const initialToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const shouldStartLoading = initialToken !== null || bypassAuth;
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(shouldStartLoading);
  
  const checkAuth = async () => {
    // Kiểm tra token trước - không cần set loading nếu không có token
    const token = localStorage.getItem('auth_token');
    
    if (!token && !bypassAuth) {
      // Không có token và không phải dev mode - set unauthenticated ngay, không cần loading
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      if (bypassAuth) {
        // Dev mode: bypass authentication
        setUser({ email: 'dev@example.com', name: 'Dev User', picture: '', sub: 'dev' });
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Có token, gọi API để kiểm tra (token đã được check ở trên, không thể null)
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await apiService.checkAuth();
      if (response.isAuthenticated) {
        // Nếu có user từ response, dùng user đó
        if (response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          // Nếu không có user từ response nhưng isAuthenticated = true
          // Thử decode token từ localStorage để lấy user info
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userFromToken: User = {
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              sub: payload.sub
            };
            setUser(userFromToken);
            setIsAuthenticated(true);
          } catch (decodeError) {
            // Nếu không decode được token, clear và yêu cầu đăng nhập lại
            localStorage.removeItem('auth_token');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // Response trả về isAuthenticated = false, clear token
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      // Nếu có lỗi (401, network error, etc.), clear auth và yêu cầu đăng nhập lại
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      const response = await apiService.login(userData);
      if (response.success) {
        setUser(userData);
        setIsAuthenticated(true);
        // Wait a bit for token to be stored, then reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        throw new Error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      // Show user-friendly error message
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as any).message === 'string' &&
        (error as any).message.includes('mangoforsalon.com')
      ) {
        alert('Chỉ email có domain @mangoforsalon.com mới được truy cập hệ thống.');
      } else {
        alert('Đăng nhập thất bại. Vui lòng thử lại.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
