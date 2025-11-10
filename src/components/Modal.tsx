import React from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  maxWidth?: string;
  maxHeight?: string;
  showCloseButton?: boolean;
  headerBackground?: 'gradient' | 'white';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '90%',
  maxWidth = '800px',
  maxHeight = '80vh',
  showCloseButton = true,
  headerBackground = 'gradient',
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-animated" onClick={onClose}>
      <div
        className="modal-content-animated"
        style={{
          width,
          maxWidth,
          maxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-header-animated ${headerBackground === 'gradient' ? 'modal-header-gradient' : 'modal-header-white'}`}>
          <h3>{title}</h3>
          {showCloseButton && (
            <button
              className="modal-close-button"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        <div className="modal-body-animated">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

