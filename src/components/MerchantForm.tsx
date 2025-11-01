import React, { useState, useEffect } from 'react';
import { Merchant, MerchantFormData } from '../types/merchant';
import './MerchantForm.css';

interface MerchantFormProps {
  merchant?: Merchant;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (merchant: MerchantFormData) => void;
  title: string;
}

const MerchantForm: React.FC<MerchantFormProps> = ({
  merchant,
  isOpen,
  onClose,
  onSubmit,
  title,
}) => {
  const [formData, setFormData] = useState<MerchantFormData>({
    name: '',
    storeId: '',
    address: '',
    street: '',
    area: '',
    state: '',
    zipcode: '',
    lastInteractionDate: '',
    platform: '',
    phone: '',
  });

  // Helper function to convert date format to YYYY-MM-DD for input[type="date"]
  const convertDateFormat = (dateString: string): string => {
    if (!dateString) return '';
    
    // Check if it's already in YYYY-MM-DD format
    if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
      return dateString;
    }
    
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    const slashParts = dateString.split('/');
    if (slashParts.length === 3) {
      const [month, day, year] = slashParts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Convert from MM-DD-YYYY to YYYY-MM-DD
    const dashParts = dateString.split('-');
    if (dashParts.length === 3) {
      const [month, day, year] = dashParts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString;
  };

  useEffect(() => {
    if (merchant) {
      setFormData({
        name: merchant.name,
        storeId: merchant.storeId || '',
        address: merchant.address,
        street: merchant.street,
        area: merchant.area,
        state: merchant.state,
        zipcode: merchant.zipcode,
        lastInteractionDate: convertDateFormat(merchant.lastInteractionDate),
        platform: merchant.platform,
        phone: merchant.phone,
      });
    } else {
      setFormData({
        name: '',
        storeId: '',
        address: '',
        street: '',
        area: '',
        state: '',
        zipcode: '',
        lastInteractionDate: '',
        platform: '',
        phone: '',
      });
    }
  }, [merchant, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper: ensure submit date is ISO date-only (YYYY-MM-DD)
  const convertDateFormatForSubmit = (dateString: string): string => {
    if (!dateString) return '';

    // Already ISO date-only
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // If input like MM-DD-YYYY => convert to YYYY-MM-DD
    const mdYMatch = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (mdYMatch) {
      const [, mm, dd, yyyy] = mdYMatch;
      const month = mm.padStart(2, '0');
      const day = dd.padStart(2, '0');
      return `${yyyy}-${month}-${day}`;
    }

    // Fallback: try Date parse and extract date part
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        .toISOString()
        .slice(0, 10);
    }

    return dateString;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert date format before submitting
    const formDataToSubmit = {
      ...formData,
      lastInteractionDate: convertDateFormatForSubmit(formData.lastInteractionDate)
    };
    
    onSubmit(formDataToSubmit);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content form-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Merchant Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="storeId">Store ID</label>
              <input
                type="text"
                id="storeId"
                name="storeId"
                value={formData.storeId || ''}
                onChange={handleChange}
                placeholder="e.g., S04314"
              />
            </div>
            <div className="form-group">
              <label htmlFor="platform">Platform *</label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                required
              >
                <option value="">Select Platform</option>
                <option value="Crisp">Crisp</option>
                <option value="Vonage">Vonage</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Full Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="street">Street Name</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="area">Area</label>
              <input
                type="text"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="state">State/City *</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="zipcode">Zip Code</label>
              <input
                type="text"
                id="zipcode"
                name="zipcode"
                value={formData.zipcode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lastInteractionDate">Last Interaction Date *</label>
            <input
              type="date"
              id="lastInteractionDate"
              name="lastInteractionDate"
              value={formData.lastInteractionDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {merchant ? 'Update' : 'Add New'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantForm;
