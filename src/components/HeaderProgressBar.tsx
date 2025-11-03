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
      // Tự động ẩn sau 10 giây
      const timer = setTimeout(() => {
        setShowResults(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isUpdating, updateResults]);

  // Hiển thị results sau khi update xong
  if (!isUpdating && showResults && updateResults.length > 0) {
    const updatedCount = updateResults.filter(r => r.success && r.updated).length;
    const skippedCount = updateResults.filter(r => r.success && !r.updated).length;
    const addedCount = updateResults.filter(r => r.success && r.added).length;
    const errorCount = updateResults.filter(r => !r.success).length;
    
    // Calculate total call logs added (from results with callLogsAdded property)
    const totalCallLogsAdded = updateResults.reduce((sum, r) => sum + (r.callLogsAdded || 0), 0);

    return (
      <div className="header-progress-bar results-bar">
        <div className="header-progress-content">
          <div className="results-summary-inline">
            {updatedCount > 0 && <span className="summary-success">✅ {updatedCount} cập nhật</span>}
            {addedCount > 0 && <span className="summary-success">➕ {addedCount} đã thêm</span>}
            {totalCallLogsAdded > 0 && <span className="summary-success">📞 {totalCallLogsAdded} call logs đã sync</span>}
            {skippedCount > 0 && <span className="summary-skipped">⏭️ {skippedCount} bỏ qua</span>}
            {errorCount > 0 && <span className="summary-error">❌ {errorCount} lỗi</span>}
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
            {currentMerchant || 'Đang khởi tạo...'}
          </span>
          {currentIndex > 0 && totalMerchants > 0 && (
            <span className="header-progress-count">
              ({currentIndex} / {totalMerchants})
            </span>
          )}
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
            title="Dừng cập nhật"
          >
            {shouldStop ? 'Đang dừng...' : 'Dừng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderProgressBar;

