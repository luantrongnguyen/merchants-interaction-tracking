import React, { useState } from 'react';
import { MerchantWithStatus, SupportNote } from '../types/merchant';
import { getStatusColor, getStatusText, formatDate } from '../utils/merchantUtils';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import './MerchantList.css';
import MerchantStatsModal from './MerchantStatsModal';

interface MerchantListProps {
  merchants: MerchantWithStatus[];
  onEdit: (merchant: MerchantWithStatus) => void;
  onDelete: (id: number) => void;
}

const MerchantList: React.FC<MerchantListProps> = ({ merchants, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [showHistoryFor, setShowHistoryFor] = React.useState<MerchantWithStatus | null>(null);
  const [showCallLogsFor, setShowCallLogsFor] = React.useState<MerchantWithStatus | null>(null);
  const [showStatsFor, setShowStatsFor] = React.useState<MerchantWithStatus | null>(null);
  const [showSupportNoteFor, setShowSupportNoteFor] = useState<MerchantWithStatus | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

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
              <th>ID</th>
              <th>Total Interactions</th>
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
                  <div className="action-buttons">
                    <button
                      className="btn-delete"
                      onClick={() => onDelete(merchant.id!)}
                      title="Delete"
                    >
                      🗑️
                    </button>
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
                        setNewNoteContent('');
                        setNoteError(null);
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

      {showCallLogsFor && (
        <div className="modal-overlay" onClick={() => setShowCallLogsFor(null)}>
          <div className="modal-content call-logs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Call Logs - {showCallLogsFor.name}</h3>
              <button className="close-button" onClick={() => setShowCallLogsFor(null)}>×</button>
            </div>
            <div className="modal-body">
              {(!showCallLogsFor.supportLogs || showCallLogsFor.supportLogs.length === 0) && (
                <div className="empty-state">No call logs found.</div>
              )}
              {showCallLogsFor.supportLogs && showCallLogsFor.supportLogs.length > 0 && (
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
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCallLogsFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

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
                        {log.data.storeId && <div><strong>Store ID:</strong> {log.data.storeId}</div>}
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

      {showStatsFor && (
        <MerchantStatsModal merchant={showStatsFor} onClose={() => setShowStatsFor(null)} />
      )}

      {showSupportNoteFor && (
        <div className="modal-overlay" onClick={() => setShowSupportNoteFor(null)}>
          <div className="modal-content support-note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Support Notes - {showSupportNoteFor.name}</h3>
              <button className="close-button" onClick={() => setShowSupportNoteFor(null)}>×</button>
            </div>
            <div className="modal-body">
              {noteError && (
                <div className="error-banner" style={{ marginBottom: '1rem' }}>
                  <span>{noteError}</span>
                  <button onClick={() => setNoteError(null)} className="error-close">×</button>
                </div>
              )}
              
              {/* Existing Notes List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#374151' }}>Existing Notes</h4>
                {!showSupportNoteFor.supportNotes || showSupportNoteFor.supportNotes.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No support notes yet. Add your first note below.
                  </div>
                ) : (
                  <div className="support-notes-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
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

              {/* Add New Note Form */}
              <div className="form-group">
                <label htmlFor="new-support-note" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
                  Add New Note
                </label>
                <textarea
                  id="new-support-note"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter your support note here..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={async () => {
                  if (!showSupportNoteFor.id) return;
                  if (!newNoteContent.trim()) {
                    setNoteError('Note content cannot be empty');
                    return;
                  }
                  try {
                    setIsSavingNote(true);
                    setNoteError(null);
                    await apiService.addMerchantSupportNote(showSupportNoteFor.id, newNoteContent.trim());
                    setNewNoteContent('');
                    // Refresh merchants list by reloading page
                    window.location.reload();
                  } catch (err) {
                    console.error('Error adding support note:', err);
                    setNoteError(`Failed to add support note: ${err instanceof Error ? err.message : String(err)}`);
                  } finally {
                    setIsSavingNote(false);
                  }
                }}
                disabled={isSavingNote || !newNoteContent.trim()}
              >
                {isSavingNote ? 'Adding...' : 'Add Note'}
              </button>
              <button className="btn-secondary" onClick={() => setShowSupportNoteFor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantList;
