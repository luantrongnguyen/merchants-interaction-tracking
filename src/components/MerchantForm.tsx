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
    address: '',
    street: '',
    area: '',
    state: '',
    zipcode: '',
    lastInteractionDate: '',
    platform: '',
    phone: '',
  });

  useEffect(() => {
    if (merchant) {
      setFormData({
        name: merchant.name,
        address: merchant.address,
        street: merchant.street,
        area: merchant.area,
        state: merchant.state,
        zipcode: merchant.zipcode,
        lastInteractionDate: merchant.lastInteractionDate,
        platform: merchant.platform,
        phone: merchant.phone,
      });
    } else {
      setFormData({
        name: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
