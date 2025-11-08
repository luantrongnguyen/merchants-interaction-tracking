import React from 'react';
import GoogleAuth from './GoogleAuth';
import HeaderProgressBar from './HeaderProgressBar';
import GreetingBanner from './GreetingBanner';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSyncCallLogsManual?: () => void;
  // Progress bar props
  isSyncingManual?: boolean;
  syncProgress?: number;
  syncStatus?: string;
  syncResults?: {
    matched: number;
    updated: number;
    errors: number;
    totalCallLogsAdded: number;
  } | null;
  onCloseSyncResults?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSyncCallLogsManual,
  isSyncingManual = false,
  syncProgress = 0,
  syncStatus = '',
  syncResults = null,
  onCloseSyncResults,
}) => {
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
                <GreetingBanner userName={user.name || user.email} compact={true} />
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
      {(isSyncingManual || syncResults) && (
        <HeaderProgressBar
          isUpdating={isSyncingManual}
          progress={syncProgress}
          currentMerchant={syncStatus || 'Đang sync call logs từ tất cả sheets...'}
          currentIndex={0}
          totalMerchants={0}
          shouldStop={false}
          updateResults={syncResults ? [{
            merchant: 'Sync Call Logs Manual',
            storeId: '',
            success: syncResults.errors === 0,
            message: `Matched: ${syncResults.matched}, Updated: ${syncResults.updated}, Errors: ${syncResults.errors}`,
            updated: syncResults.updated > 0,
            callLogsAdded: syncResults.totalCallLogsAdded,
          }] : []}
          onStop={() => {}}
          onClose={onCloseSyncResults || (() => {})}
        />
      )}
    </header>
  );
};

export default Header;

