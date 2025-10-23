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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.checkAuth();
      if (response.isAuthenticated && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
      } else {
        throw new Error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Show user-friendly error message
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as any).message === 'string' &&
        (error as any).message.includes('mangoforsalon.com')
      ) {
        alert('Chỉ email có domain @mangoforsalon.com mới được truy cập.');
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
      console.error('Logout failed:', error);
    } finally {
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
