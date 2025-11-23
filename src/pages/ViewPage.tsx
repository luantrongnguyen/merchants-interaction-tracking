import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MerchantWithStatus } from '../types/merchant';
import { calculateMerchantStatus, countTerminalDeviceIssues } from '../utils/merchantUtils';
import apiService from '../services/apiService';
import MerchantListView from '../components/MerchantListView';
import Dashboard from '../components/Dashboard';
import Sidebar from '../components/Sidebar';
import './ViewPage.css';


const ViewPage: React.FC = () => {
  const [merchants, setMerchants] = useState<MerchantWithStatus[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMerchantsForGuest();
      const merchantsWithStatus = data.map(calculateMerchantStatus);
      
      // Sort by total interactions (descending - most interactions first)
      const sortedMerchants = merchantsWithStatus.sort((a, b) => {
        const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
        const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
        return interactionsB - interactionsA;
      });
      
      setMerchants(sortedMerchants);
      setFilteredMerchants(sortedMerchants);
    } catch (err) {
      setError('Unable to load merchant data. Please check backend API connection.');
    } finally {
      setLoading(false);
    }
  };

  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentStatusFilter, setCurrentStatusFilter] = useState<'all' | 'green' | 'orange' | 'red' | 'terminal-device-issues'>('all');

  const handleSearch = (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
    applyFilters(searchTerm, currentStatusFilter);
  };

  const handleFilter = (status: 'all' | 'green' | 'orange' | 'red' | 'terminal-device-issues') => {
    setCurrentStatusFilter(status);
    applyFilters(currentSearchTerm, status);
  };

  const handleClear = () => {
    setCurrentSearchTerm('');
    setCurrentStatusFilter('all');
    setFilteredMerchants(merchants);
  };

  const applyFilters = (searchTerm: string, status: 'all' | 'green' | 'orange' | 'red' | 'terminal-device-issues') => {
    let filtered = merchants;

    // Apply status filter
    if (status !== 'all' && status !== 'terminal-device-issues') {
      filtered = filtered.filter(merchant => merchant.status === status);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(merchant => {
        return (
          merchant.phone?.toLowerCase().includes(term) ||
          merchant.zipcode?.toLowerCase().includes(term) ||
          merchant.name?.toLowerCase().includes(term) ||
          merchant.address?.toLowerCase().includes(term) ||
          false
        );
      });
    }

    // Sort based on filter type
    if (status === 'terminal-device-issues') {
      filtered = filtered.sort((a, b) => {
        const issuesA = countTerminalDeviceIssues(a);
        const issuesB = countTerminalDeviceIssues(b);
        return issuesB - issuesA;
      });
      filtered = filtered.filter(merchant => countTerminalDeviceIssues(merchant) > 0);
    } else {
      filtered = filtered.sort((a, b) => {
        const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
        const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
        return interactionsB - interactionsA;
      });
    }

    setFilteredMerchants(filtered);
  };

  if (loading) {
    return (
      <div className="app-container view-page-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  const location = useLocation();
  
  // Determine active page from pathname for views
  const getActivePage = (): 'dashboard' | 'merchant-list' => {
    if (location.pathname.includes('/views/dashboard')) return 'dashboard';
    return 'merchant-list';
  };

  const handlePageChange = (page: 'dashboard' | 'merchant-list') => {
    // Navigation is handled by Routes, so we don't need to do anything here
    // The Sidebar will use navigate internally
  };

  return (
    <div className="app-container view-page-container">
      <div className="app-layout">
        <Sidebar activePage={getActivePage()} onPageChange={handlePageChange} />
        <main className="app-main view-page-main">
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={loadMerchants} className="retry-button">
                Retry
              </button>
            </div>
          )}
          <Routes>
            <Route 
              index
              element={
                <MerchantListView
                  merchants={filteredMerchants}
                  error={error}
                  onRetry={loadMerchants}
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  onClear={handleClear}
                />
              } 
            />
            <Route 
              path="dashboard" 
              element={
                <div className="dashboard-page-content">
                  <Dashboard merchants={merchants} />
                </div>
            } 
          />
            <Route path="*" element={<Navigate to="/views" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default ViewPage;

