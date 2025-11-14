import React, { useState } from 'react';
import { CONFIG } from '../config';
import './PasscodeModal.css';
import Modal from './Modal';

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (passcode?: string) => void;
  title: string;
}

const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === CONFIG.PASSSCODE) {
      setError('');
      const validatedPasscode = passcode;
      setPasscode('');
      onSuccess(validatedPasscode);
      onClose();
    } else {
      setError('Invalid authentication code');
    }
  };

  const handleClose = () => {
    setPasscode('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      width="400px"
      maxWidth="90%"
      maxHeight="90vh"
      headerBackground="white"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="passcode">Enter authentication code:</label>
          <input
            type="password"
            id="passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter authentication code"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
          {error && <div className="error-message" style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>{error}</div>}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={handleClose} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '6px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', border: '1px solid #d1d5db', background: '#f3f4f6', color: '#374151' }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '6px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: '#fbbf24', color: '#1f2937' }}>
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PasscodeModal;
