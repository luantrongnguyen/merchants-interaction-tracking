import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MerchantFormData, Merchant, MerchantWithStatus } from './types/merchant';
import { calculateMerchantStatus, countTerminalDeviceIssues } from './utils/merchantUtils';
import apiService from './services/apiService';
import MerchantForm from './components/MerchantForm';
import Modal from './components/Modal';
import SheetSelectionModal from './components/SheetSelectionModal';
import Header from './components/Header';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import MerchantListPage from './pages/MerchantListPage';
import ViewPage from './pages/ViewPage';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const location = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const isViewPage = location.pathname.startsWith('/views');
  const [merchants, setMerchants] = useState<MerchantWithStatus[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetSelectionOpen, setIsSheetSelectionOpen] = useState(false);
  const [pendingPasscode, setPendingPasscode] = useState<string | null>(null);
  const [editingMerchant, setEditingMerchant] = useState<MerchantWithStatus | undefined>();
  const [formTitle, setFormTitle] = useState('');
  const [merchantToDelete, setMerchantToDelete] = useState<{ id: number; name: string } | null>(null);

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
    const merchant = merchants.find(m => m.id === id);
    if (merchant) {
      setMerchantToDelete({ id, name: merchant.name });
    }
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

  const handleConfirmDelete = async () => {
    if (merchantToDelete) {
      await deleteMerchant(merchantToDelete.id);
      setMerchantToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setMerchantToDelete(null);
  };

  const handleSyncCallLogsManual = async (passcode: string, selectedSheets?: string[]) => {
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
        const sheetInfo = selectedSheets && selectedSheets.length > 0 
          ? `từ ${selectedSheets.length} sheets được chọn` 
          : 'từ tất cả sheets';
        setSyncStatus(`Đang đọc call logs ${sheetInfo}...`);
        const result = await apiService.syncCallLogsManual(passcode, selectedSheets);
        
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
  };

  const handleSheetSelectionConfirm = (selectedSheets: string[]) => {
    if (pendingPasscode) {
      setIsSheetSelectionOpen(false);
      handleSyncCallLogsManual(pendingPasscode, selectedSheets);
      setPendingPasscode(null);
    }
  };

  const handleSheetSelectionClose = () => {
    setIsSheetSelectionOpen(false);
    setPendingPasscode(null);
  };

  const handleCloseSyncResults = () => {
    setIsSyncingManual(false);
    setSyncProgress(0);
    setSyncStatus('');
    setSyncResults(null);
  };

  const handleUpdateIsMiUpdated = (id: number, isMiUpdated: boolean, miVersion?: string) => {
    // Update in both merchants and filteredMerchants
    setMerchants(prevMerchants => 
      prevMerchants.map(m => m.id === id ? { ...m, isMiUpdated, miVersion } : m)
    );
    setFilteredMerchants(prevFiltered => 
      prevFiltered.map(m => m.id === id ? { ...m, isMiUpdated, miVersion } : m)
    );
  };

  const handleUpdateMiVersion = (id: number, miVersion: string) => {
    // Update in both merchants and filteredMerchants
    setMerchants(prevMerchants => 
      prevMerchants.map(m => m.id === id ? { ...m, miVersion } : m)
    );
    setFilteredMerchants(prevFiltered => 
      prevFiltered.map(m => m.id === id ? { ...m, miVersion } : m)
    );
  };


  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentStatusFilter, setCurrentStatusFilter] = useState<'all' | 'green' | 'orange' | 'red' | 'terminal-device-issues'>('all');

  const applyFilters = () => {
    let filtered = merchants;

    // Apply status filter
    if (currentStatusFilter !== 'all' && currentStatusFilter !== 'terminal-device-issues') {
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

    // Sort based on filter type
    if (currentStatusFilter === 'terminal-device-issues') {
      // Sort by terminal/device issues count (descending - most issues first)
      filtered = filtered.sort((a, b) => {
        const issuesA = countTerminalDeviceIssues(a);
        const issuesB = countTerminalDeviceIssues(b);
        return issuesB - issuesA;
      });
      // Only show merchants with at least one terminal/device issue
      filtered = filtered.filter(merchant => countTerminalDeviceIssues(merchant) > 0);
    } else {
      // Sort by total interactions (descending - most interactions first)
      filtered = filtered.sort((a, b) => {
        const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
        const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
        return interactionsB - interactionsA;
      });
    }

    setFilteredMerchants(filtered);
  };

  const handleSearch = (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
    
    // Apply filters immediately
    let filtered = merchants;

    // Apply status filter
    if (currentStatusFilter !== 'all' && currentStatusFilter !== 'terminal-device-issues') {
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

    // Sort based on filter type
    if (currentStatusFilter === 'terminal-device-issues') {
      // Sort by terminal/device issues count (descending - most issues first)
      filtered = filtered.sort((a, b) => {
        const issuesA = countTerminalDeviceIssues(a);
        const issuesB = countTerminalDeviceIssues(b);
        return issuesB - issuesA;
      });
      // Only show merchants with at least one terminal/device issue
      filtered = filtered.filter(merchant => countTerminalDeviceIssues(merchant) > 0);
    } else {
      // Sort by total interactions (descending - most interactions first)
      filtered = filtered.sort((a, b) => {
        const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
        const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
        return interactionsB - interactionsA;
      });
    }

    setFilteredMerchants(filtered);
  };

  const handleFilter = (status: 'all' | 'green' | 'orange' | 'red' | 'terminal-device-issues') => {
    setCurrentStatusFilter(status);
    
    // Apply filters immediately
    let filtered = merchants;

    // Apply status filter
    if (status !== 'all' && status !== 'terminal-device-issues') {
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

    // Sort based on filter type
    if (status === 'terminal-device-issues') {
      // Sort by terminal/device issues count (descending - most issues first)
      filtered = filtered.sort((a, b) => {
        const issuesA = countTerminalDeviceIssues(a);
        const issuesB = countTerminalDeviceIssues(b);
        return issuesB - issuesA;
      });
      // Only show merchants with at least one terminal/device issue
      filtered = filtered.filter(merchant => countTerminalDeviceIssues(merchant) > 0);
    } else {
      // Sort by total interactions (descending - most interactions first)
      filtered = filtered.sort((a, b) => {
        const interactionsA = a.supportLogs ? a.supportLogs.length : 0;
        const interactionsB = b.supportLogs ? b.supportLogs.length : 0;
        return interactionsB - interactionsA;
      });
    }

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
      {!isViewPage && (
        <Header 
          isSyncingManual={isSyncingManual}
          syncProgress={syncProgress}
          syncStatus={syncStatus}
          syncResults={syncResults}
          onCloseSyncResults={handleCloseSyncResults}
        />
      )}

      <Routes>
        {/* Guest view route - no authentication required - must be before catch-all route */}
        <Route path="/views" element={<ViewPage />} />
        <Route path="/views/dashboard/fullscreen" element={<ViewPage />} />
        <Route path="/views/*" element={<ViewPage />} />
        
        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage
                  merchants={merchants}
                  error={error}
                  onRetry={loadMerchants}
                  onSyncCallLogs={handleSyncCallLogsManual}
                  isSyncing={isSyncingManual}
                  syncProgress={syncProgress}
                  syncStatus={syncStatus}
                  syncResults={syncResults}
                />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <MerchantListPage
                  merchants={filteredMerchants}
                  error={error}
                  onRetry={loadMerchants}
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  onClear={handleClearSearch}
                  onEdit={handleEditMerchant}
                  onDelete={handleDeleteMerchant}
                  onUpdateIsMiUpdated={handleUpdateIsMiUpdated}
                  onUpdateMiVersion={handleUpdateMiVersion}
                  onSyncCallLogs={handleSyncCallLogsManual}
                  isSyncing={isSyncingManual}
                  syncProgress={syncProgress}
                  syncStatus={syncStatus}
                  syncResults={syncResults}
                />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/" replace />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>

      <MerchantForm
        merchant={editingMerchant}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        title={formTitle}
      />

      {merchantToDelete && (
        <Modal
          isOpen={!!merchantToDelete}
          onClose={handleCancelDelete}
          title="Confirm Delete"
          width="400px"
          maxWidth="90%"
          headerBackground="white"
        >
          <div style={{ padding: '1rem 0' }}>
            <p style={{ marginBottom: '1.5rem', color: '#475569' }}>
              Are you sure you want to delete merchant <strong>{merchantToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelDelete}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid #d1d5db',
                  background: '#f3f4f6',
                  color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
      <SheetSelectionModal
        isOpen={isSheetSelectionOpen}
        onClose={handleSheetSelectionClose}
        onConfirm={handleSheetSelectionConfirm}
        passcode={pendingPasscode || ''}
      />
    </div>
  );
}

export default App;
