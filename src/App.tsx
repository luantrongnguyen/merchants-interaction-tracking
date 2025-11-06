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
import './App.css';

function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [merchants, setMerchants] = useState<MerchantWithStatus[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantWithStatus | undefined>();
  const [formTitle, setFormTitle] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);


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
    setPendingAction(() => () => deleteMerchant(id));
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

  const handlePasscodeSuccess = async () => {
    if (pendingAction) {
      try {
        await pendingAction();
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
      <Header />

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
          title="Authentication Required"
        />

      </ProtectedRoute>
    </div>
  );
}

export default App;
