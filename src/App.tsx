import { useState, useEffect } from 'react';
import { MerchantFormData, MerchantWithStatus } from './types/merchant';
import { calculateMerchantStatus } from './utils/merchantUtils';
import apiService from './services/apiService';
import MerchantList from './components/MerchantList';
import MerchantForm from './components/MerchantForm';
import PasscodeModal from './components/PasscodeModal';
import StatsPanel from './components/StatsPanel';
import SearchFilter from './components/SearchFilter';
import GoogleAuth from './components/GoogleAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [merchants, setMerchants] = useState<MerchantWithStatus[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasscodeOpen, setIsPasscodeOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantWithStatus | undefined>();
  const [formTitle, setFormTitle] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMerchants();
      const merchantsWithStatus = data.map(calculateMerchantStatus);
      
      // Sort by lastInteractionDate (oldest first)
      const sortedMerchants = merchantsWithStatus.sort((a, b) => {
        const dateA = new Date(a.lastInteractionDate);
        const dateB = new Date(b.lastInteractionDate);
        return dateA.getTime() - dateB.getTime(); // Ascending order (oldest first)
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

    // Sort by lastInteractionDate (oldest first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.lastInteractionDate);
      const dateB = new Date(b.lastInteractionDate);
      return dateA.getTime() - dateB.getTime(); // Ascending order (oldest first)
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

    // Sort by lastInteractionDate (oldest first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.lastInteractionDate);
      const dateB = new Date(b.lastInteractionDate);
      return dateA.getTime() - dateB.getTime(); // Ascending order (oldest first)
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

    // Sort by lastInteractionDate (oldest first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.lastInteractionDate);
      const dateB = new Date(b.lastInteractionDate);
      return dateA.getTime() - dateB.getTime(); // Ascending order (oldest first)
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
      <header className="app-header">
        <div className="header-content">
          <h1>Merchant Interaction Tracking</h1>
          <GoogleAuth
            onLogin={login}
            onLogout={logout}
            isAuthenticated={isAuthenticated}
            user={user}
          />
        </div>
      </header>

      <ProtectedRoute>
        <main className="app-main">
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={loadMerchants} className="retry-button">
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
                onSearch={handleSearch}
                onFilter={handleFilter}
                onClear={handleClearSearch}
              />
              
              <div className="controls">
                <button onClick={handleAddMerchant} className="btn-primary">
                  Add New Merchant
                </button>
                <button onClick={loadMerchants} className="btn-secondary">
                  Refresh
                </button>
              </div>

              <MerchantList
                merchants={filteredMerchants}
                onEdit={handleEditMerchant}
                onDelete={handleDeleteMerchant}
              />
            </div>
          </div>
        </main>

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
