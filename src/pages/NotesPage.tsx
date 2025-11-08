import React, { useState, useEffect, useMemo } from 'react';
import { Note, CreateNoteData } from '../types/note';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import './NotesPage.css';

const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForDate, setCreateForDate] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<CreateNoteData>({
    title: '',
    content: '',
  });

  // Get dates for the current week (Sunday to Saturday)
  const getWeekDates = (date: Date): string[] => {
    const dates: string[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Adjust to Sunday
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = useMemo(() => getWeekDates(new Date(selectedDate)), [selectedDate]);

  useEffect(() => {
    loadNotes();
    // Poll for new notes every 30 seconds
    const interval = setInterval(loadNotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getNotes();
      setNotes(data);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await apiService.createNote(
        newNote.title,
        newNote.content,
        createForDate || undefined
      );
      setNewNote({ title: '', content: '' });
      setShowCreateForm(false);
      setCreateForDate(null);
      await loadNotes();
      // Refresh unread count in parent
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('notesUpdated'));
      }
    } catch (err) {
      console.error('Error creating note:', err);
      setError(`Failed to create note: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddNoteClick = (date: string) => {
    setCreateForDate(date);
    setShowCreateForm(true);
  };

  // Group notes by date
  const notesByDate = useMemo(() => {
    const grouped: { [date: string]: Note[] } = {};
    notes.forEach(note => {
      const date = note.noteDate || note.createdAt.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(note);
    });
    return grouped;
  }, [notes]);

  // Filter notes for selected date
  const filteredNotes = useMemo(() => {
    return notesByDate[selectedDate] || [];
  }, [notesByDate, selectedDate]);

  const handleMarkAsRead = async (noteId: number) => {
    try {
      await apiService.markNoteAsRead(noteId);
      await loadNotes();
      // Refresh unread count in parent
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('notesUpdated'));
      }
    } catch (err) {
      console.error('Error marking note as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotesAsRead();
      await loadNotes();
      // Refresh unread count in parent
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('notesUpdated'));
      }
    } catch (err) {
      console.error('Error marking all notes as read:', err);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await apiService.deleteNote(noteId);
      await loadNotes();
      // Refresh unread count in parent
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('notesUpdated'));
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(`Failed to delete note: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const isNoteUnread = (note: Note): boolean => {
    if (!user?.email) return false;
    if (!note.readBy || note.readBy.length === 0) return true;
    return !note.readBy.includes(user.email);
  };

  const unreadCount = notes.filter(isNoteUnread).length;

  if (loading && notes.length === 0) {
    return (
      <div className="notes-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <div className="notes-header">
        <h1>Notes</h1>
        <div className="notes-actions">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary"
              title="Mark all notes as read"
            >
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Week Date Selector */}
      <div className="week-date-selector">
        <button
          onClick={() => {
            const prevWeek = new Date(selectedDate);
            prevWeek.setDate(prevWeek.getDate() - 7);
            setSelectedDate(prevWeek.toISOString().split('T')[0]);
          }}
          className="week-nav-btn"
          title="Previous week"
        >
          ◀
        </button>
        <div className="week-dates">
          {weekDates.map((date) => {
            const dateObj = new Date(date);
            const isSelected = date === selectedDate;
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = dateObj.getDate();
            const isToday = date === new Date().toISOString().split('T')[0];
            const notesCount = notesByDate[date]?.length || 0;

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`week-date-item ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                title={dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              >
                <div className="week-date-day">{dayName}</div>
                <div className="week-date-number">{dayNumber}</div>
                {notesCount > 0 && (
                  <div className="week-date-badge">{notesCount}</div>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            const nextWeek = new Date(selectedDate);
            nextWeek.setDate(nextWeek.getDate() + 7);
            setSelectedDate(nextWeek.toISOString().split('T')[0]);
          }}
          className="week-nav-btn"
          title="Next week"
        >
          ▶
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateForm(false);
          setCreateForDate(null);
          setNewNote({ title: '', content: '' });
        }}>
          <div className="modal-content create-note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Note</h2>
              {createForDate && (
                <p className="modal-subtitle">
                  For {new Date(createForDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForDate(null);
                  setNewNote({ title: '', content: '' });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateNote}>
              <div className="form-group">
                <label htmlFor="note-title">Title *</label>
                <input
                  id="note-title"
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Enter note title"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="note-content">Content *</label>
                <textarea
                  id="note-content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Enter note content"
                  rows={6}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Note'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForDate(null);
                    setNewNote({ title: '', content: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="notes-list-by-date">
        <div className="date-section">
          <h2 className="date-section-title">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <div className="notes-list">
            {filteredNotes.map((note) => {
              const unread = isNoteUnread(note);
              return (
                <div
                  key={note.id}
                  className={`note-card ${unread ? 'unread' : ''}`}
                  onClick={() => {
                    if (unread) {
                      handleMarkAsRead(note.id);
                    }
                  }}
                >
                  <div className="note-header">
                    <div className="note-title-row">
                      <h3>{note.title}</h3>
                      {unread && <span className="unread-badge">New</span>}
                    </div>
                    <div className="note-meta">
                      <span className="note-author">
                        By {note.createdByName || note.createdBy}
                      </span>
                      <span className="note-time">
                        {new Date(note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="note-content">
                    <p>{note.content}</p>
                  </div>
                  <div className="note-actions">
                    {note.createdBy === user?.email && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="btn-delete-small"
                        title="Delete note"
                      >
                        Delete
                      </button>
                    )}
                    {unread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(note.id);
                        }}
                        className="btn-mark-read"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Add New Note Card */}
            <div
              className="note-card add-note-card"
              onClick={() => handleAddNoteClick(selectedDate)}
            >
              <div className="add-note-content">
                <div className="add-note-icon">+</div>
                <div className="add-note-text">Add New Note</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;

