import React from 'react';
import GoogleAuth from './GoogleAuth';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSyncCallLogsManual?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSyncCallLogsManual }) => {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1>Merchant Tracking</h1>
        <div className="header-actions">
          <GoogleAuth
            onLogin={login}
            onLogout={logout}
            isAuthenticated={isAuthenticated}
            user={user}
          />
          {isAuthenticated && user && (
            <>
              {onSyncCallLogsManual && (
                <button
                  onClick={onSyncCallLogsManual}
                  className="btn-primary header-sync-btn"
                  title="Sync Call Logs Manually (All Sheets)"
                >
                  Sync Call Logs Manual
                </button>
              )}
              <div className="header-user-info">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name || user.email}
                    className="user-avatar"
                  />
                )}
                <span className="user-name">{user.name || user.email}</span>
                <button 
                  onClick={logout}
                  className="btn-secondary logout-btn"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

