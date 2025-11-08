import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  activePage: 'dashboard' | 'merchant-list' | 'notes';
  onPageChange: (page: 'dashboard' | 'merchant-list' | 'notes') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active page from pathname
  const getActivePage = (): 'dashboard' | 'merchant-list' | 'notes' => {
    if (location.pathname === '/dashboard') return 'dashboard';
    if (location.pathname === '/notes') return 'notes';
    return 'merchant-list';
  };

  const currentActivePage = getActivePage();
  
  const handlePageChange = (page: 'dashboard' | 'merchant-list' | 'notes') => {
    if (page === 'dashboard') {
      navigate('/dashboard');
    } else if (page === 'notes') {
      navigate('/notes');
    } else {
      navigate('/');
    }
  };
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          <li>
            <button
              className={`sidebar-item ${currentActivePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handlePageChange('dashboard')}
              title="Dashboard - Overview and Statistics"
            >
              <div className="sidebar-item-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
              </div>
              <span className="sidebar-item-text">Dashboard</span>
              {currentActivePage === 'dashboard' && <div className="sidebar-item-indicator"></div>}
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${currentActivePage === 'merchant-list' ? 'active' : ''}`}
              onClick={() => handlePageChange('merchant-list')}
              title="Merchant List - View all merchants"
            >
              <div className="sidebar-item-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className="sidebar-item-text">Merchants</span>
              {currentActivePage === 'merchant-list' && <div className="sidebar-item-indicator"></div>}
            </button>
          </li>
          <li>
            <button
              className={`sidebar-item ${currentActivePage === 'notes' ? 'active' : ''}`}
              onClick={() => handlePageChange('notes')}
              title="Notes - View and create notes"
            >
              <div className="sidebar-item-icon-wrapper">
                <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <span className="sidebar-item-text">Notes</span>
              {currentActivePage === 'notes' && <div className="sidebar-item-indicator"></div>}
            </button>
          </li>
        </ul>
        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <div className="sidebar-footer-icon">✨</div>
            <p className="sidebar-footer-text">Copyright belongs to Support Team</p>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

