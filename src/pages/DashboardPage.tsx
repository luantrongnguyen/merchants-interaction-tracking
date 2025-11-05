import React from 'react';
import Dashboard from '../components/Dashboard';
import StatsPanel from '../components/StatsPanel';
import { MerchantWithStatus } from '../types/merchant';

interface DashboardPageProps {
  merchants: MerchantWithStatus[];
  error: string | null;
  onRetry: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ merchants, error, onRetry }) => {
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
    </>
  );
};

export default DashboardPage;

