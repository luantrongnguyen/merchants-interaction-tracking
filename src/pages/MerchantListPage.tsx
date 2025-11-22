import React, { useState } from 'react';
import MerchantList from '../components/MerchantList';
import ChatBox from '../components/ChatBox';
import { MerchantWithStatus } from '../types/merchant';
import { useAuth } from '../contexts/AuthContext';

interface MerchantListPageProps {
  merchants: MerchantWithStatus[];
  error: string | null;
  onRetry: () => void;
  onSearch: (query: string) => void;
  onFilter: (status: 'all' | 'green' | 'orange' | 'red' | 'terminal-device-issues') => void;
  onClear: () => void;
  onEdit: (merchant: MerchantWithStatus) => void;
  onDelete: (id: number) => void;
  onUpdateIsMiUpdated?: (id: number, isMiUpdated: boolean, miVersion?: string) => void;
  onUpdateMiVersion?: (id: number, miVersion: string) => void;
  onSyncCallLogs?: (passcode: string) => Promise<void>;
  isSyncing?: boolean;
  syncProgress?: number;
  syncStatus?: string;
  syncResults?: {
    matched: number;
    updated: number;
    errors: number;
    totalCallLogsAdded: number;
  } | null;
}

const MerchantListPage: React.FC<MerchantListPageProps> = ({
  merchants,
  error,
  onRetry,
  onSearch,
  onFilter,
  onClear,
  onEdit,
  onDelete,
  onUpdateIsMiUpdated,
  onUpdateMiVersion,
  onSyncCallLogs,
  isSyncing = false,
  syncProgress = 0,
  syncStatus = '',
  syncResults = null,
}) => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    <>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={onRetry} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="app-content">
        <div className="main-content">
          <MerchantList
            merchants={merchants}
            onEdit={onEdit}
            onDelete={onDelete}
            onSearch={onSearch}
            onFilter={onFilter}
            onClear={onClear}
            onUpdateIsMiUpdated={onUpdateIsMiUpdated}
            onUpdateMiVersion={onUpdateMiVersion}
          />
        </div>
      </div>

      {!isChatOpen && (
        <button 
          className="chatbox-toggle-btn" 
          onClick={() => setIsChatOpen(true)}
          aria-label="Open AI chat"
          title="Ask AI about your data"
        >
          🤖
        </button>
      )}

      <ChatBox 
        merchants={merchants} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onSyncCallLogs={onSyncCallLogs}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        syncStatus={syncStatus}
        syncResults={syncResults}
      />
    </>
  );
};

export default MerchantListPage;

