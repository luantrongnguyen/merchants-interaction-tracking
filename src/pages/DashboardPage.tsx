import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import StatsPanel from '../components/StatsPanel';
import ChatBox from '../components/ChatBox';
import { MerchantWithStatus } from '../types/merchant';
import { useAuth } from '../contexts/AuthContext';

interface DashboardPageProps {
  merchants: MerchantWithStatus[];
  error: string | null;
  onRetry: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ merchants, error, onRetry }) => {
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
        <div className="stats-section">
          <StatsPanel merchants={merchants} />
        </div>
        
        <div className="main-content">
          <Dashboard merchants={merchants} />
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
      />
    </>
  );
};

export default DashboardPage;

