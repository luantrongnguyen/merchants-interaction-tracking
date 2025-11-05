import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const bypassAuth = process.env.REACT_APP_BYPASS_AUTH === 'true';

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // if (!isAuthenticated && !bypassAuth) {
  //   return (
  //     <div className="app-container">
  //       <div className="blank-page">
  //       </div>
  //     </div>
  //   );
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
