import React from 'react';
import { MerchantWithStatus } from '../types/merchant';
import { getStatusColor, getStatusText, formatDate } from '../utils/merchantUtils';
import './MerchantList.css';

interface MerchantListProps {
  merchants: MerchantWithStatus[];
  onEdit: (merchant: MerchantWithStatus) => void;
  onDelete: (id: number) => void;
}

const MerchantList: React.FC<MerchantListProps> = ({ merchants, onEdit, onDelete }) => {
  if (merchants.length === 0) {
    return (
      <div className="empty-state">
        <p>No merchants found. Add your first merchant!</p>
      </div>
    );
  }

  return (
    <div className="merchant-list">
      <div className="list-header">
        <h2>Merchant List ({merchants.length})</h2>
      </div>
      
      <div className="table-container">
        <table className="merchant-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Address</th>
              <th>Platform</th>
              <th>Phone</th>
              <th>Last Interaction</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant, index) => (
              <tr key={merchant.id}>
                <td className="merchant-no">
                  {index + 1}
                </td>
                <td className="merchant-name">
                  <div className="name-cell">
                    <strong>{merchant.name}</strong>
                    {merchant.street && (
                      <div className="street-info">{merchant.street}</div>
                    )}
                  </div>
                </td>
                <td className="address-cell">
                  <div className="address-info">
                    <div>{merchant.address}</div>
                    {merchant.area && (
                      <div className="area-info">{merchant.area}</div>
                    )}
                    <div className="location-info">
                      {merchant.state}
                      {merchant.zipcode && ` - ${merchant.zipcode}`}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="platform-badge">{merchant.platform}</span>
                </td>
                <td>
                  <span className="phone-info">{merchant.phone}</span>
                </td>
                <td>
                  <div className="date-info">
                    <div>{formatDate(merchant.lastInteractionDate)}</div>
                    <div className="days-info">
                      {merchant.daysSinceLastInteraction} days ago
                    </div>
                  </div>
                </td>
                <td>
                  <div
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(merchant.status) }}
                  >
                    {getStatusText(merchant.status)}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => onEdit(merchant)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(merchant.id!)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MerchantList;
