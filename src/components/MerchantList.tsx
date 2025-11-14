import React, { useState } from 'react';
import { MerchantWithStatus, SupportNote } from '../types/merchant';
import { getStatusColor, getStatusText, formatDate } from '../utils/merchantUtils';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import './MerchantList.css';
import MerchantStatsModal from './MerchantStatsModal';
import SearchFilter from './SearchFilter';
import StatsPanel from './StatsPanel';
import Modal from './Modal';

interface MerchantListProps {
  merchants: MerchantWithStatus[];
  onEdit: (merchant: MerchantWithStatus) => void;
  onDelete: (id: number) => void;
  onSearch?: (query: string) => void;
  onFilter?: (status: 'all' | 'green' | 'orange' | 'red') => void;
  onClear?: () => void;
}

const MerchantList: React.FC<MerchantListProps> = ({ merchants, onEdit, onDelete, onSearch, onFilter, onClear }) => {
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
        <div className="list-header-stats">
          <StatsPanel merchants={merchants} compact />
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

      <Modal
        isOpen={!!showHistoryFor}
        onClose={() => setShowHistoryFor(null)}
        title={`History - ${showHistoryFor?.name || ''}`}
        width="960px"
        maxWidth="96vw"
        maxHeight="86vh"
      >
        {(!showHistoryFor?.historyLogs || showHistoryFor.historyLogs.length === 0) && (
          <div>No history logs.</div>
        )}
        {showHistoryFor?.historyLogs && showHistoryFor.historyLogs.length > 0 && (
          <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {showHistoryFor.historyLogs.slice().reverse().map((log, idx) => (
              <div key={idx} className="history-item" style={{ padding: '12px 0', borderTop: idx === 0 ? 'none' : '1px solid #e5e7eb' }}>
                <div className="history-meta" style={{ color: '#374151', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <strong>{log.by || 'unknown'}</strong> at {formatDate(log.at)}
                </div>
                <div className="history-data" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px 16px' }}>
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
      </Modal>

      {showStatsFor && (
        <MerchantStatsModal merchant={showStatsFor} onClose={() => setShowStatsFor(null)} />
      )}

      <Modal
        isOpen={!!showSupportNoteFor}
        onClose={() => {
          setShowSupportNoteFor(null);
          setNewNoteContent('');
          setNoteError(null);
        }}
        title={`Support Notes - ${showSupportNoteFor?.name || ''}`}
        width="960px"
        maxWidth="96vw"
        maxHeight="86vh"
      >
        {noteError && (
          <div className="error-banner" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
            <span>{noteError}</span>
            <button onClick={() => setNoteError(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#dc2626' }}>×</button>
          </div>
        )}
        
        {/* Existing Notes List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#374151' }}>Existing Notes</h4>
          {!showSupportNoteFor?.supportNotes || showSupportNoteFor.supportNotes.length === 0 ? (
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
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            className="btn-primary"
            onClick={async () => {
              if (!showSupportNoteFor?.id) return;
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
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#fbbf24', color: '#1f2937', fontWeight: 600, cursor: 'pointer' }}
          >
            {isSavingNote ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MerchantList;
