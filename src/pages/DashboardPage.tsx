import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import ChatBox from '../components/ChatBox';
import { MerchantWithStatus } from '../types/merchant';
import { useAuth } from '../contexts/AuthContext';
import './DashboardPage.css';

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
  const location = useLocation();
  const navigate = useNavigate();
  const isFullscreen = location.pathname === '/dashboard/fullscreen';
  
  return (
    <div className={isFullscreen ? 'dashboard-fullscreen-container' : ''}>
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

      {!isFullscreen && !isChatOpen && (
        <button 
          className="chatbox-toggle-btn" 
          onClick={() => setIsChatOpen(true)}
          aria-label="Open AI chat"
          title="Ask AI about your data"
        >
          🤖
        </button>
      )}

      {!isFullscreen && (
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
      )}
    </div>
  );
};

export default DashboardPage;

