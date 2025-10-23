import React, { useState, useEffect, useRef } from 'react';
import './SearchFilter.css';

interface SearchFilterProps {
  onSearch: (searchTerm: string) => void;
  onFilter: (status: 'all' | 'green' | 'orange' | 'red') => void;
  onClear: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onFilter, onClear }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'orange' | 'red'>('all');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleStatusFilter = (status: 'all' | 'green' | 'orange' | 'red') => {
    setStatusFilter(status);
    onFilter(status);
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('all');
    onClear();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300); // 300ms delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="search-filter">
      <div className="search-filter__content">
        <div className="search-filter__row">
          <div className="search-filter__input-group">
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Search..."
              className="search-filter__input"
            />
            <button 
              onClick={handleClear} 
              className="search-filter__clear-btn"
              title="Clear search"
            >
              ×
            </button>
          </div>

          <div className="search-filter__status-group">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as 'all' | 'green' | 'orange' | 'red')}
              className="search-filter__select"
            >
              <option value="all">All Status</option>
              <option value="green">Good</option>
              <option value="orange">Attention</option>
              <option value="red">Contact</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;
