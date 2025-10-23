import React, { useState, useEffect } from 'react';
import { MerchantFormData, MerchantWithStatus } from './types/merchant';
import { calculateMerchantStatus } from './utils/merchantUtils';
import apiService from './services/apiService';
import MerchantList from './components/MerchantList';
import MerchantForm from './components/MerchantForm';
import PasscodeModal from './components/PasscodeModal';
import './App.css';

function App() {
  const [merchants, setMerchants] = useState<MerchantWithStatus[]>([]);
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
      setMerchants(merchantsWithStatus);
    } catch (err) {
      setError('Unable to load merchant data. Please check backend API connection.');
      console.error('Error loading merchants:', err);
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
      await loadMerchants();
    } catch (err) {
      setError('Unable to delete merchant. Please try again.');
      console.error('Error deleting merchant:', err);
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
    } catch (err) {
      setError('Unable to save merchant. Please try again.');
      console.error('Error saving merchant:', err);
    }
  };

  const handlePasscodeSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handlePasscodeClose = () => {
    setIsPasscodeOpen(false);
    setPendingAction(null);
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
        <h1>Merchant Interaction Tracking</h1>
        <p>Manage and track interactions with merchants</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={loadMerchants} className="retry-button">
              Retry
            </button>
          </div>
        )}

        <div className="controls">
          <button onClick={handleAddMerchant} className="btn-primary">
            Add New Merchant
          </button>
          <button onClick={loadMerchants} className="btn-secondary">
            Refresh
          </button>
        </div>

        <MerchantList
          merchants={merchants}
          onEdit={handleEditMerchant}
          onDelete={handleDeleteMerchant}
        />
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
    </div>
  );
}

export default App;
