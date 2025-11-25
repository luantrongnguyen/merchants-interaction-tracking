import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import apiService from '../services/apiService';
import './SheetSelectionModal.css';

interface SheetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSheets: string[]) => void;
  passcode: string;
}

const SheetSelectionModal: React.FC<SheetSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  passcode,
}) => {
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSheets();
    } else {
      // Reset when modal closes
      setSheets([]);
      setSelectedSheets(new Set());
      setError(null);
    }
  }, [isOpen]);

  const loadSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const sheetList = await apiService.getCallLogsSheets();
      setSheets(sheetList);
      // Select all by default
      setSelectedSheets(new Set(sheetList));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSheet = (sheetName: string) => {
    setSelectedSheets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sheetName)) {
        newSet.delete(sheetName);
      } else {
        newSet.add(sheetName);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedSheets(new Set(sheets));
  };

  const handleDeselectAll = () => {
    setSelectedSheets(new Set());
  };

  const handleConfirm = () => {
    if (selectedSheets.size === 0) {
      setError('Please select at least one sheet');
      return;
    }
    onConfirm(Array.from(selectedSheets));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Sheets to Sync"
      width="600px"
      maxWidth="90%"
      maxHeight="80vh"
      headerBackground="white"
    >
      <div className="sheet-selection-modal-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Loading sheets...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            {error}
            <button
              onClick={loadSheets}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: '#f3f4f6',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: '#f3f4f6',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: '#f3f4f6',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Deselect All
              </button>
            </div>
            <div className="sheet-list" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem' }}>
              {sheets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No sheets found
                </div>
              ) : (
                sheets.map(sheetName => (
                  <label
                    key={sheetName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSheets.has(sheetName)}
                      onChange={() => handleToggleSheet(sheetName)}
                      style={{
                        marginRight: '0.75rem',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '0.9375rem', color: '#1e293b' }}>{sheetName}</span>
                  </label>
                ))
              )}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.875rem', color: '#64748b' }}>
              Selected: {selectedSheets.size} of {sheets.length} sheets
            </div>
            {error && (
              <div style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
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
                onClick={handleConfirm}
                className="btn-primary"
                disabled={selectedSheets.size === 0}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: selectedSheets.size === 0 ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: selectedSheets.size === 0 ? '#d1d5db' : '#fbbf24',
                  color: '#1f2937',
                  opacity: selectedSheets.size === 0 ? 0.6 : 1,
                }}
              >
                Sync Selected Sheets
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SheetSelectionModal;

