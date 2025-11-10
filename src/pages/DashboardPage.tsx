import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import ChatBox from '../components/ChatBox';
import { MerchantWithStatus } from '../types/merchant';
import { useAuth } from '../contexts/AuthContext';

interface DashboardPageProps {
  merchants: MerchantWithStatus[];
  error: string | null;
  onRetry: () => void;
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

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  merchants, 
  error, 
  onRetry, 
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

      <div className="dashboard-page-content">
        <Dashboard merchants={merchants} />
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

export default DashboardPage;

