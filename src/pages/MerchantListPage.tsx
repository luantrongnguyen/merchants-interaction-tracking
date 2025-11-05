import React from 'react';
import MerchantList from '../components/MerchantList';
import SearchFilter from '../components/SearchFilter';
import StatsPanel from '../components/StatsPanel';
import { MerchantWithStatus } from '../types/merchant';

interface MerchantListPageProps {
  merchants: MerchantWithStatus[];
  error: string | null;
  onRetry: () => void;
  onSearch: (query: string) => void;
  onFilter: (status: 'all' | 'green' | 'orange' | 'red') => void;
  onClear: () => void;
  onEdit: (merchant: MerchantWithStatus) => void;
  onDelete: (id: number) => void;
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
}) => {
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
          <SearchFilter
            onSearch={onSearch}
            onFilter={onFilter}
            onClear={onClear}
          />

          <MerchantList
            merchants={merchants}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </>
  );
};

export default MerchantListPage;

