import React from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Determine active page from pathname
  const getActivePage = (): 'dashboard' | 'merchant-list' => {
    if (location.pathname === '/dashboard') return 'dashboard';
    return 'merchant-list';
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={getActivePage()} onPageChange={() => {}} />
      
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default Layout;

