import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MerchantFormData, Merchant, MerchantWithStatus } from './types/merchant';
import { calculateMerchantStatus } from './utils/merchantUtils';
import apiService from './services/apiService';
import MerchantForm from './components/MerchantForm';
import PasscodeModal from './components/PasscodeModal';
import Header from './components/Header';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import MerchantListPage from './pages/MerchantListPage';
import { useAuth } from './contexts/AuthContext';
import ChristmasTheme from './components/ChristmasTheme';
import './App.css';
import './themes/christmas.css';

function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isChristmasTheme, setIsChristmasTheme] = useState(false);
  const [merchants, setMerchants] = useState<MerchantWithStatus[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantWithStatus | undefined>();
  const [formTitle, setFormTitle] = useState('');
  const [pendingAction, setPendingAction] = useState<((passcode?: string) => Promise<void>) | null>(null);

  // Sync manual states
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncResults, setSyncResults] = useState<{
    matched: number;
    updated: number;
    errors: number;
    totalCallLogsAdded: number;
  } | null>(null);


  useEffect(() => {
    // Chỉ load merchants khi đã đăng nhập
    if (isAuthenticated) {
    loadMerchants();
    }
  }, [isAuthenticated]);

  const loadMerchants = async () => {
    // Kiểm tra authentication trước khi gọi API
    if (!isAuthenticated) {
      setError('Please log in to access data.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMerchants();
      const merchantsWithStatus = data.map(calculateMerchantStatus);
      
      // Sort by total interactions (descending - most interactions first)
      const sortedMerchants = merchantsWithStatus.sort((a, b) => {
        const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
        const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
        // Descending order (most interactions first)
        return interactionsB - interactionsA;
      });
      
      setMerchants(sortedMerchants);
      setFilteredMerchants(sortedMerchants);
      // Clear any existing errors on successful load
      setError(null);
    } catch (err) {
      setError('Unable to load merchant data. Please check backend API connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMerchant = () => {
    setEditingMerchant(undefined);
    setFormTitle('Add New Merchant');
    setIsFormOpen(true);
  };

  const handleEditMerchant = (merchant: MerchantWithStatus) => {
    setEditingMerchant(merchant);
    setFormTitle('Edit Merchant');
    setIsFormOpen(true);
  };

  const handleDeleteMerchant = (id: number) => {
    setPendingAction(() => async () => {
      await deleteMerchant(id);
    });
    setIsPasscodeOpen(true);
  };

  const deleteMerchant = async (id: number) => {
    try {
      await apiService.deleteMerchant(id);
      // Force reload merchants list
      await loadMerchants();
      // Clear any existing errors on successful delete
      setError(null);
    } catch (err) {
      setError('Unable to delete merchant. Please try again.');
    }
  };

  const handleFormSubmit = async (formData: MerchantFormData) => {
    try {
      if (editingMerchant) {
        await apiService.updateMerchant(editingMerchant.id!, formData);
      } else {
        await apiService.addMerchant(formData);
      }
      await loadMerchants();
      // Clear any existing errors on successful save
      setError(null);
    } catch (err) {
      setError('Unable to save merchant. Please try again.');
    }
  };

  const handlePasscodeSuccess = async (passcode?: string) => {
    if (pendingAction) {
      try {
        // Pass passcode to the action if it needs it
        await pendingAction(passcode);
        setPendingAction(null);
        setIsPasscodeOpen(false); // Close modal after successful action
      } catch (error) {
        // Error is already handled in the action function
        setPendingAction(null);
        setIsPasscodeOpen(false); // Close modal even on error
      }
    }
  };

  const handlePasscodeClose = () => {
    setIsPasscodeOpen(false);
    setPendingAction(null);
  };

  const handleSyncCallLogsManual = () => {
    setPendingAction(() => async (passcode?: string) => {
      try {
        if (!passcode) {
          throw new Error('Passcode is required');
        }
        
        // Start sync with progress
        setIsSyncingManual(true);
        setSyncProgress(0);
        setSyncStatus('Đang khởi tạo sync...');
        setSyncResults(null);
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setSyncProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 5;
          });
        }, 500);

        try {
          setSyncStatus('Đang đọc call logs từ tất cả sheets...');
          const result = await apiService.syncCallLogsManual(passcode);
          
          clearInterval(progressInterval);
          setSyncProgress(100);
          setSyncStatus('Hoàn thành!');
          setSyncResults(result);
          setError(null);
          
          // Reload merchants after sync
          await loadMerchants();
          
          // Auto hide after 5 seconds
          setTimeout(() => {
            setIsSyncingManual(false);
            setSyncProgress(0);
            setSyncStatus('');
            setSyncResults(null);
          }, 5000);
        } catch (syncErr) {
          clearInterval(progressInterval);
          setIsSyncingManual(false);
          setSyncProgress(0);
          setSyncStatus('');
          throw syncErr;
        }
      } catch (err) {
        setIsSyncingManual(false);
        setSyncProgress(0);
        setSyncStatus('');
        const errorMessage = err instanceof Error ? err.message : 'Unable to sync call logs manually. Please try again.';
        setError(errorMessage);
        throw err;
      }
    });
    setIsPasscodeOpen(true);
  };

  const handleCloseSyncResults = () => {
    setIsSyncingManual(false);
    setSyncProgress(0);
    setSyncStatus('');
    setSyncResults(null);
  };


  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentStatusFilter, setCurrentStatusFilter] = useState<'all' | 'green' | 'orange' | 'red'>('all');

  const applyFilters = () => {
    let filtered = merchants;

    // Apply status filter
    if (currentStatusFilter !== 'all') {
      filtered = filtered.filter(merchant => merchant.status === currentStatusFilter);
    }

    // Apply search filter
    if (currentSearchTerm) {
      const term = currentSearchTerm.toLowerCase();
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

    // Sort by total interactions (descending - most interactions first)
    filtered = filtered.sort((a, b) => {
      const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
      const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
      return interactionsB - interactionsA;
    });

    setFilteredMerchants(filtered);
  };

  const handleSearch = (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
    
    // Apply filters immediately
    let filtered = merchants;

    // Apply status filter
    if (currentStatusFilter !== 'all') {
      filtered = filtered.filter(merchant => merchant.status === currentStatusFilter);
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

    // Sort by total interactions (descending - most interactions first)
    filtered = filtered.sort((a, b) => {
      const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
      const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
      return interactionsB - interactionsA;
    });

    setFilteredMerchants(filtered);
  };

  const handleFilter = (status: 'all' | 'green' | 'orange' | 'red') => {
    setCurrentStatusFilter(status);
    
    // Apply filters immediately
    let filtered = merchants;

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(merchant => merchant.status === status);
    }

    // Apply search filter
    if (currentSearchTerm) {
      const term = currentSearchTerm.toLowerCase();
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

    // Sort by total interactions (descending - most interactions first)
    filtered = filtered.sort((a, b) => {
      const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
      const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
      return interactionsB - interactionsA;
    });

    setFilteredMerchants(filtered);
  };

  const handleClearSearch = () => {
    setCurrentSearchTerm('');
    setCurrentStatusFilter('all');
    setFilteredMerchants(merchants);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header 
        onSyncCallLogsManual={handleSyncCallLogsManual}
        isSyncingManual={isSyncingManual}
        syncProgress={syncProgress}
        syncStatus={syncStatus}
        syncResults={syncResults}
        onCloseSyncResults={handleCloseSyncResults}
        isChristmasTheme={isChristmasTheme}
        onToggleChristmasTheme={() => setIsChristmasTheme(!isChristmasTheme)}
      />

      <ProtectedRoute>
        <Layout>
          <Routes>
            <Route 
              path="/" 
              element={
                <MerchantListPage
                  merchants={filteredMerchants}
                  error={error}
                  onRetry={loadMerchants}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onClear={handleClearSearch}
                  onEdit={handleEditMerchant}
                  onDelete={handleDeleteMerchant}
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <DashboardPage
                  merchants={merchants}
                  error={error}
                  onRetry={loadMerchants}
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>

        <MerchantForm
          merchant={editingMerchant}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          title={formTitle}
        />

        <PasscodeModal
          isOpen={isPasscodeOpen}
          onClose={handlePasscodeClose}
          onSuccess={handlePasscodeSuccess}
          title={pendingAction ? "Authentication Required" : "Authentication Required"}
        />

        <ChristmasTheme 
          enabled={isChristmasTheme}
          onToggle={() => setIsChristmasTheme(!isChristmasTheme)}
        />
      </ProtectedRoute>
    </div>
  );
}

export default App;
