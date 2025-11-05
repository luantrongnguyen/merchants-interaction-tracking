import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  activePage: 'dashboard' | 'merchant-list';
  onPageChange: (page: 'dashboard' | 'merchant-list') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active page from pathname
  const getActivePage = (): 'dashboard' | 'merchant-list' => {
    if (location.pathname === '/dashboard') return 'dashboard';
    return 'merchant-list';
  };

  const currentActivePage = getActivePage();
  
  const handlePageChange = (page: 'dashboard' | 'merchant-list') => {
    navigate(page === 'dashboard' ? '/dashboard' : '/');
  };
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-header">
          <h2>Navigation</h2>
        </div>
        <ul className="sidebar-menu">
          <li>
            <button
              className={`sidebar-item ${currentActivePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handlePageChange('dashboard')}
            >
              <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${currentActivePage === 'merchant-list' ? 'active' : ''}`}
              onClick={() => handlePageChange('merchant-list')}
            >
              <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16"></path>
              </svg>
              <span>Merchant List</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

