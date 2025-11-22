import React, { useState } from 'react';
import { MerchantWithStatus, SupportNote } from '../types/merchant';
import { getStatusColor, getStatusText, formatDate } from '../utils/merchantUtils';
import './MerchantList.css';
import MerchantStatsModal from './MerchantStatsModal';
import SearchFilter from './SearchFilter';
import StatsPanel from './StatsPanel';
import Modal from './Modal';

interface MerchantListViewProps {
  merchants: MerchantWithStatus[];
  error: string | null;
  onRetry: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (status: 'all' | 'green' | 'orange' | 'red' | 'terminal-device-issues') => void;
  onClear?: () => void;
}

const MerchantListView: React.FC<MerchantListViewProps> = ({ 
  merchants, 
  error, 
  onRetry, 
  onSearch, 
  onFilter, 
  onClear 
}) => {
  const [showCallLogsFor, setShowCallLogsFor] = React.useState<MerchantWithStatus | null>(null);
  const [showStatsFor, setShowStatsFor] = React.useState<MerchantWithStatus | null>(null);
  const [showSupportNoteFor, setShowSupportNoteFor] = useState<MerchantWithStatus | null>(null);

  return (
    <div className="merchant-list">
      <div className="list-header">
        <h2>Merchant List ({merchants.length})</h2>
        <div className="list-header-stats">
          {merchants.length > 0 && <StatsPanel merchants={merchants} compact />}
        </div>
        {(onSearch || onFilter || onClear) && (
          <div className="list-header-search">
            <SearchFilter
              onSearch={onSearch || (() => {})}
              onFilter={onFilter || (() => {})}
              onClear={onClear || (() => {})}
            />
          </div>
        )}
      </div>
      
      {merchants.length === 0 ? (
        <div className="empty-state">
          <p>No merchants found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="merchant-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>ID</th>
                <th>Total Interactions</th>
                <th>Last Interaction</th>
                <th>Status</th>
                <th>MI Updated</th>
                <th>Z11/Not Go With</th>
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
                <td>
                  <span className="store-id">{merchant.storeId || '-'}</span>
                </td>
                <td>
                  <span className="interactions-count">
                    {merchant.supportLogs ? merchant.supportLogs.length : 0}
                  </span>
                </td>
                <td>
                  <div className="date-info">
                    <div>{formatDate(merchant.lastInteractionDate)}</div>
                    <div className="days-info">
                      {merchant.daysSinceLastInteraction}d
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
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={merchant.isMiUpdated || false}
                      disabled={true}
                      readOnly={true}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'not-allowed',
                        opacity: 1,
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={merchant.z11OrNotGoWMango === true}
                      disabled={true}
                      readOnly={true}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'not-allowed',
                        opacity: 1,
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-history"
                      onClick={() => setShowStatsFor(merchant)}
                      title="Stats"
                    >
                      📊
                    </button>
                    <button
                      className="btn-call-logs"
                      onClick={() => setShowCallLogsFor(merchant)}
                      title="Call Logs"
                    >
                      📞
                    </button>
                    <button
                      className="btn-support-note"
                      onClick={() => {
                        setShowSupportNoteFor(merchant);
                      }}
                      title="Support Notes"
                    >
                      📝
                      {merchant.supportNotes && merchant.supportNotes.length > 0 && (
                        <span style={{ 
                          marginLeft: '4px', 
                          fontSize: '0.75rem',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {merchant.supportNotes.length}
                        </span>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!showCallLogsFor}
        onClose={() => setShowCallLogsFor(null)}
        title={`Call Logs - ${showCallLogsFor?.name || ''}`}
        width="960px"
        maxWidth="96vw"
        maxHeight="86vh"
      >
        {(!showCallLogsFor?.supportLogs || showCallLogsFor.supportLogs.length === 0) && (
          <div className="empty-state">No call logs found.</div>
        )}
        {showCallLogsFor?.supportLogs && showCallLogsFor.supportLogs.length > 0 && (
          <div className="call-logs-list">
            {showCallLogsFor.supportLogs.slice().reverse().map((log, idx) => (
              <div key={idx} className="call-log-item">
                <div className="call-log-header">
                  <div className="call-log-date-time">
                    <span className="call-log-date">📅 {log.date}</span>
                    <span className="call-log-time">🕐 {log.time}</span>
                  </div>
                  {log.supporter && (
                    <div className="call-log-supporter">
                      👤 {log.supporter}
                    </div>
                  )}
                </div>
                {log.issue && (
                  <div className="call-log-issue">
                    <strong>Issue:</strong> {log.issue}
                  </div>
                )}
                {log.category && (
                  <div className="call-log-issue">
                    <strong>Category:</strong> {log.category}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {showStatsFor && (
        <MerchantStatsModal merchant={showStatsFor} onClose={() => setShowStatsFor(null)} />
      )}

      <Modal
        isOpen={!!showSupportNoteFor}
        onClose={() => {
          setShowSupportNoteFor(null);
        }}
        title={`Support Notes - ${showSupportNoteFor?.name || ''}`}
        width="960px"
        maxWidth="96vw"
        maxHeight="86vh"
      >
        {/* Existing Notes List - Read Only */}
        <div>
          <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#374151' }}>Support Notes</h4>
          {!showSupportNoteFor?.supportNotes || showSupportNoteFor.supportNotes.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No support notes available.
            </div>
          ) : (
            <div className="support-notes-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {showSupportNoteFor.supportNotes.map((note: SupportNote, index: number) => (
                <div key={index} className="support-note-item" style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ fontWeight: 600, color: '#374151' }}>
                      {note.createdBy || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(note.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div style={{ color: '#111827', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {note.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MerchantListView;

