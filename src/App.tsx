import { useState, useEffect, useRef } from 'react';
import { MerchantFormData, Merchant, MerchantWithStatus } from './types/merchant';
import { calculateMerchantStatus } from './utils/merchantUtils';
import apiService from './services/apiService';
import MerchantList from './components/MerchantList';
import MerchantForm from './components/MerchantForm';
import PasscodeModal from './components/PasscodeModal';
import HeaderProgressBar from './components/HeaderProgressBar';
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
  const [isUpdatePasscodeOpen, setIsUpdatePasscodeOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantWithStatus | undefined>();
  const [formTitle, setFormTitle] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Update progress states
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [currentMerchant, setCurrentMerchant] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalMerchants, setTotalMerchants] = useState<number>(0);
  const [shouldStop, setShouldStop] = useState(false); // để dừng cập nhật hàng loạt
  const shouldStopRef = useRef(false);
  const [updateResults, setUpdateResults] = useState<Array<{merchant: string, storeId: string, success: boolean, message: string, updated?: boolean}>>([]);

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

  // Handle update passcode success
  const handleUpdatePasscodeSuccess = () => {
    setIsUpdatePasscodeOpen(false);
    startBulkUpdate();
  };

  const handleUpdatePasscodeClose = () => {
    if (!isUpdating) {
      setIsUpdatePasscodeOpen(false);
    }
  };

  const handleStopUpdate = () => {
    shouldStopRef.current = true;
    setShouldStop(true);
  };

  const updateMerchantLastInteraction = async (merchant: MerchantWithStatus) => {
    if (!merchant.storeId) {
      throw new Error('Store ID không tồn tại');
    }

    console.log(`\n🔍 Processing ${merchant.name} (${merchant.storeId})...`);
    
    // Fetch lại merchant từ API để đảm bảo có đầy đủ thông tin
    let fullMerchant: Merchant;
    try {
      console.log(`  📥 Fetching full merchant data for id=${merchant.id}...`);
      fullMerchant = await apiService.getMerchant(merchant.id!);
      console.log(`  ✅ Got full merchant data:`, {
        name: fullMerchant.name,
        address: fullMerchant.address,
        state: fullMerchant.state,
        phone: fullMerchant.phone
      });
    } catch (error) {
      console.error(`  ⚠️  Failed to fetch merchant, using current data:`, error);
      // Nếu không fetch được, dùng data hiện tại
      fullMerchant = merchant as Merchant;
    }

    const transactionService = (await import('./services/transactionService')).default;

    // Gọi API transaction
    console.log(`  📡 Calling transaction API for ${merchant.storeId}...`);
    const transactionResponse = await transactionService.getTransactionByStoreCode(merchant.storeId);
    console.log(`  ✅ Got response:`, transactionResponse?.data?.length || 0, 'transactions');
    
    // Lấy date từ transaction đầu tiên
    const latestDate = transactionService.getLatestTransactionDate(transactionResponse);
    console.log(`  📅 Latest transaction date:`, latestDate || 'null');
    
    if (!latestDate) {
      console.log(`  ⚠️  No transactions found`);
      return { updated: false, message: 'Không có transaction nào' };
    }

    // So sánh với lastInteractionDate hiện tại
    const currentDate = fullMerchant.lastInteractionDate;
    console.log(`  📆 Current lastInteractionDate:`, currentDate);
    
    const isNewer = transactionService.isDateNewer(latestDate, currentDate);
    console.log(`  🔄 Is newer?`, isNewer, `(${latestDate} vs ${currentDate})`);

    if (!isNewer) {
      console.log(`  ⏭️  Skipped: Date not newer`);
      return { 
        updated: false, 
        message: `Date mới nhất (${latestDate}) không mới hơn date hiện tại (${currentDate})` 
      };
    }

    // Update merchant với lastInteractionDate mới
    // Đảm bảo tất cả field required không bị empty - dùng data từ fullMerchant
    // Nếu field bị thiếu, điền giá trị mặc định
    const updateData = {
      name: fullMerchant.name || '',
      storeId: fullMerchant.storeId || '',
      address: (fullMerchant.address && fullMerchant.address.trim() !== '') ? fullMerchant.address : ',',
      street: fullMerchant.street || '',
      area: fullMerchant.area || '',
      state: (fullMerchant.state && fullMerchant.state.trim() !== '') ? fullMerchant.state : ',',
      zipcode: fullMerchant.zipcode || '',
      lastInteractionDate: latestDate,
      platform: fullMerchant.platform || '',
      phone: (fullMerchant.phone && fullMerchant.phone.trim() !== '') ? fullMerchant.phone : ',',
    };

    // Log warning nếu phải dùng giá trị mặc định
    if (updateData.address === ',') {
      console.warn(`  ⚠️  Address is empty for merchant ${merchant.id}, using default: ","`);
    }
    if (updateData.state === ',') {
      console.warn(`  ⚠️  State is empty for merchant ${merchant.id}, using default: ","`);
    }
    if (updateData.phone === ',') {
      console.warn(`  ⚠️  Phone is empty for merchant ${merchant.id}, using default: ","`);
    }

    console.log(`  💾 Updating merchant ${merchant.id}...`, {
      name: updateData.name,
      address: updateData.address,
      state: updateData.state,
      phone: updateData.phone,
      lastInteractionDate: updateData.lastInteractionDate
    });
    
    try {
      await apiService.updateMerchant(merchant.id!, updateData, 'updated by system');
      console.log(`  ✅ Successfully updated!`);
    } catch (error) {
      console.error(`  ❌ Update failed:`, error);
      throw error;
    }

    return { 
      updated: true, 
      message: `Đã cập nhật từ ${currentDate} sang ${latestDate}` 
    };
  };

  const startBulkUpdate = async () => {
    setIsUpdating(true);
    shouldStopRef.current = false;
    setShouldStop(false);
    setUpdateProgress(0);
    setCurrentIndex(0);
    setCurrentMerchant('');
    setUpdateResults([]);

    // Filter merchants có storeId
    const merchantsWithStoreId = merchants.filter(m => m.storeId && m.storeId.trim() !== '');
    const merchantsToUpdate = merchantsWithStoreId; // Update tất cả
    const total = merchantsToUpdate.length;
    setTotalMerchants(total);

    console.log(`🚀 Bắt đầu update ${total} merchants`);

    if (total === 0) {
      setIsUpdating(false);
      setError('Không có merchant nào có Store ID để cập nhật.');
      return;
    }

    const results: Array<{merchant: string, storeId: string, success: boolean, message: string, updated?: boolean}> = [];

    for (let i = 0; i < merchantsToUpdate.length; i++) {
      // Kiểm tra nếu user muốn dừng
      if (shouldStopRef.current) {
        setError('Đã dừng cập nhật theo yêu cầu người dùng.');
        break;
      }

      const merchant = merchantsToUpdate[i];
      setCurrentIndex(i + 1);
      setCurrentMerchant(`${merchant.name} (${merchant.storeId})`);
      
      // Update progress
      const progressValue = ((i + 1) / total) * 100;
      setUpdateProgress(progressValue);

      try {
        const result = await updateMerchantLastInteraction(merchant);
        results.push({
          merchant: merchant.name,
          storeId: merchant.storeId || '',
          success: true,
          message: result.message,
          updated: result.updated
        });
        console.log(`✅ ${merchant.name}: ${result.message}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          merchant: merchant.name,
          storeId: merchant.storeId || '',
          success: false,
          message: errorMessage
        });
        console.error(`❌ Error updating ${merchant.name}:`, errorMessage);
      }

      // Update results để hiển thị real-time
      setUpdateResults([...results]);

      // Delay nhỏ để tránh spam API
      if (i < merchantsToUpdate.length - 1 && !shouldStopRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsUpdating(false);
    setShouldStop(false);
    shouldStopRef.current = false;
    setCurrentMerchant('');
    
    // Log tổng kết
    const updatedCount = results.filter(r => r.success && r.updated).length;
    const skippedCount = results.filter(r => r.success && !r.updated).length;
    const errorCount = results.filter(r => !r.success).length;
    console.log(`\n📊 Tổng kết: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
    
    // Reload merchants sau khi hoàn thành
    await loadMerchants();
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
          <div className="header-actions">
            {!isUpdating && (
              <button 
                onClick={() => setIsUpdatePasscodeOpen(true)} 
                className="btn-primary header-update-btn"
                title="Cập nhật Last Interaction Date từ transaction API"
              >
                Weekly Update
              </button>
            )}
            <GoogleAuth
              onLogin={login}
              onLogout={logout}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          </div>
        </div>
      </header>

      <HeaderProgressBar
        isUpdating={isUpdating}
        progress={updateProgress}
        currentMerchant={currentMerchant}
        currentIndex={currentIndex}
        totalMerchants={totalMerchants}
        shouldStop={shouldStop}
        updateResults={updateResults}
        onStop={handleStopUpdate}
        onClose={() => setUpdateResults([])}
      />

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

        <PasscodeModal
          isOpen={isUpdatePasscodeOpen}
          onClose={handleUpdatePasscodeClose}
          onSuccess={handleUpdatePasscodeSuccess}
          title="Confirm to update all merchants"
        />
      </ProtectedRoute>
    </div>
  );
}

export default App;
