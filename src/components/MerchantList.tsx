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
  const [showHistoryFor, setShowHistoryFor] = React.useState<MerchantWithStatus | null>(null);

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
                    {(merchant.lastModifiedAt || merchant.lastModifiedBy) && (
                      <div className="modified-info">
                        {merchant.lastModifiedAt && (
                          <span>Updated: {formatDate(merchant.lastModifiedAt)}</span>
                        )}
                        {merchant.lastModifiedAt && merchant.lastModifiedBy && ' · '}
                        {merchant.lastModifiedBy && (
                          <span>by {merchant.lastModifiedBy}</span>
                        )}
                      </div>
                    )}
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
                    <button
                      className="btn-history"
                      onClick={() => setShowHistoryFor(merchant)}
                      title="History"
                    >
                      History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showHistoryFor && (
        <div className="modal-overlay" onClick={() => setShowHistoryFor(null)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>History - {showHistoryFor.name}</h3>
              <button className="close-button" onClick={() => setShowHistoryFor(null)}>×</button>
            </div>
            <div className="modal-body">
              {(!showHistoryFor.historyLogs || showHistoryFor.historyLogs.length === 0) && (
                <div>No history logs.</div>
              )}
              {showHistoryFor.historyLogs && showHistoryFor.historyLogs.length > 0 && (
                <div className="history-list">
                  {showHistoryFor.historyLogs.slice().reverse().map((log, idx) => (
                    <div key={idx} className="history-item">
                      <div className="history-meta">
                        <strong>{log.by || 'unknown'}</strong> at {formatDate(log.at)}
                      </div>
                      <div className="history-data">
                        <div><strong>Name:</strong> {log.data.name}</div>
                        <div><strong>Address:</strong> {log.data.address}</div>
                        {log.data.street && <div><strong>Street:</strong> {log.data.street}</div>}
                        {log.data.area && <div><strong>Area:</strong> {log.data.area}</div>}
                        <div><strong>State:</strong> {log.data.state}</div>
                        {log.data.zipcode && <div><strong>Zip:</strong> {log.data.zipcode}</div>}
                        <div><strong>Last Interaction:</strong> {formatDate(log.data.lastInteractionDate)}</div>
                        <div><strong>Platform:</strong> {log.data.platform}</div>
                        <div><strong>Phone:</strong> {log.data.phone}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowHistoryFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantList;
