import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const bypassAuth = process.env.REACT_APP_BYPASS_AUTH === 'true';

  // Nếu đang loading, hiển thị loading trong main content (header vẫn hiển thị bên ngoài)
  if (isLoading) {
    return (
      <main className="app-main">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>
      </main>
    );
  }

  // Nếu chưa đăng nhập, hiển thị blank page (header với GoogleAuth button vẫn hiển thị)
  if (!isAuthenticated && !bypassAuth) {
    return (
      <main className="app-main">
        <div className="blank-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>Vui lòng đăng nhập để tiếp tục</p>
        </div>
      </main>
    );
  }

  // Đã đăng nhập, hiển thị nội dung
  return <>{children}</>;
};

export default ProtectedRoute;
