import React, { useState, useEffect } from 'react';
import './HeaderProgressBar.css';

interface UpdateResult {
  merchant: string;
  storeId: string;
  success: boolean;
  message: string;
  updated?: boolean;
  added?: boolean;
  callLogsAdded?: number;
}

interface HeaderProgressBarProps {
  isUpdating: boolean;
  progress: number;
  currentMerchant: string;
  currentIndex: number;
  totalMerchants: number;
  shouldStop: boolean;
  updateResults: UpdateResult[];
  onStop: () => void;
  onClose: () => void;
}

const HeaderProgressBar: React.FC<HeaderProgressBarProps> = ({
  isUpdating,
  progress,
  currentMerchant,
  currentIndex,
  totalMerchants,
  shouldStop,
  updateResults,
  onStop,
  onClose,
}) => {
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Hiển thị results khi update xong và có results
    if (!isUpdating && updateResults.length > 0) {
      setShowResults(true);
      // Tự động ẩn sau 10 giây (hoặc 5 giây cho sync operation)
      const timeout = totalMerchants === 0 ? 5000 : 10000;
      const timer = setTimeout(() => {
        setShowResults(false);
      }, timeout);
      return () => clearTimeout(timer);
    } else if (isUpdating) {
      // Reset showResults khi bắt đầu update mới
      setShowResults(false);
    }
  }, [isUpdating, updateResults, totalMerchants]);

  // Hiển thị results sau khi update xong
  if (!isUpdating && showResults && updateResults.length > 0) {
    const updatedCount = updateResults.filter(r => r.success && r.updated).length;
    const skippedCount = updateResults.filter(r => r.success && !r.updated).length;
    const addedCount = updateResults.filter(r => r.success && r.added).length;
    const errorCount = updateResults.filter(r => !r.success).length;
    
    // Calculate total call logs added (from results with callLogsAdded property)
    const totalCallLogsAdded = updateResults.reduce((sum, r) => sum + (r.callLogsAdded || 0), 0);

    // Check if this is a sync operation (has callLogsAdded but no merchant count)
    const isSyncOperation = totalCallLogsAdded > 0 && totalMerchants === 0;

    return (
      <div className="header-progress-bar results-bar">
        <div className="header-progress-content">
          <div className="results-summary-inline">
            {isSyncOperation ? (
              <>
                {totalCallLogsAdded > 0 && <span className="summary-success">📞 {totalCallLogsAdded} call logs synced</span>}
                {updatedCount > 0 && <span className="summary-success">✅ {updatedCount} merchants updated</span>}
                {errorCount > 0 && <span className="summary-error">❌ {errorCount} errors</span>}
              </>
            ) : (
              <>
                {updatedCount > 0 && <span className="summary-success">✅ {updatedCount} updated</span>}
                {addedCount > 0 && <span className="summary-success">➕ {addedCount} added</span>}
                {totalCallLogsAdded > 0 && <span className="summary-success">📞 {totalCallLogsAdded} call logs synced</span>}
                {skippedCount > 0 && <span className="summary-skipped">⏭️ {skippedCount} skipped</span>}
                {errorCount > 0 && <span className="summary-error">❌ {errorCount} errors</span>}
              </>
            )}
          </div>
          <button className="header-close-btn" onClick={() => { setShowResults(false); onClose(); }}>×</button>
        </div>
      </div>
    );
  }

  if (!isUpdating) return null;

  return (
    <div className="header-progress-bar">
      <div className="header-progress-content">
        <div className="header-progress-info">
          <span className="header-progress-text">
            {currentMerchant || 'Initializing...'}
          </span>
          {currentIndex > 0 && totalMerchants > 0 ? (
            <span className="header-progress-count">
              ({currentIndex} / {totalMerchants})
            </span>
          ) : totalMerchants === 0 && currentMerchant ? (
            <span className="header-progress-count">
              Sync in progress...
            </span>
          ) : null}
        </div>
        <div className="header-progress-bar-container">
          <div 
            className="header-progress-bar-fill" 
            style={{ width: `${Math.max(progress, 0)}%` }}
          ></div>
        </div>
        <div className="header-progress-actions">
          <span className="header-progress-percent">{Math.max(Math.round(progress), 0)}%</span>
          <button 
            className="header-stop-btn" 
            onClick={onStop}
            disabled={shouldStop}
            title="Stop update"
          >
            {shouldStop ? 'Stopping...' : 'Stop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderProgressBar;

