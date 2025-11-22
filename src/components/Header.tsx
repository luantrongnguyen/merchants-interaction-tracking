import React, { useState } from 'react';
import GoogleAuth from './GoogleAuth';
import HeaderProgressBar from './HeaderProgressBar';
import GreetingBanner from './GreetingBanner';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { CONFIG } from '../config';

interface HeaderProps {
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
  isSyncingManual = false,
  syncProgress = 0,
  syncStatus = '',
  syncResults = null,
  onCloseSyncResults,
}) => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ updated: number; errors: number; skipped: number } | null>(null);

  const handleMigrateMi = async () => {
    if (!window.confirm('Bạn có chắc muốn migrate MI version? Hành động này sẽ cập nhật các row có isMiUpdated = TRUE thành JSON format "11042025".')) {
      return;
    }

    setIsMigrating(true);
    setMigrateResult(null);
    
    try {
      const result = await apiService.migrateMiVersion(CONFIG.PASSSCODE, '11042025');
      setMigrateResult(result);
      alert(`Migration hoàn tất!\nUpdated: ${result.updated}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`);
    } catch (error: any) {
      alert(`Lỗi khi migrate: ${error.message || 'Unknown error'}`);
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

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
                  onClick={handleMigrateMi}
                  className="btn-secondary migrate-btn"
                  title="Migrate MI Version"
                  disabled={isMigrating}
                  style={{
                    backgroundColor: isMigrating ? '#f3f4f6' : '#fff',
                    color: isMigrating ? '#9ca3af' : '#1e293b',
                    cursor: isMigrating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isMigrating ? 'Migrating...' : 'Migrate MI'}
                </button>
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

