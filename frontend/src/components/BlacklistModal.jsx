import React, { useState } from 'react';
import { ShieldAlert, X, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export function BlacklistModal({ isOpen, onClose, onBlacklistSuccess }) {
  const [plate, setPlate] = useState('');
  const [reason, setReason] = useState('stolen vehicle');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plate.trim() || !reason.trim()) return;

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await api.postBlacklist(plate.trim().toUpperCase(), reason.trim());
      setStatusMsg({ type: 'success', text: `Plate ${plate.trim().toUpperCase()} added to Blacklist!` });
      if (onBlacklistSuccess) {
        onBlacklistSuccess(plate.trim().toUpperCase());
      }
      setTimeout(() => {
        setPlate('');
        setReason('stolen vehicle');
        setStatusMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to blacklist plate:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit blacklist request' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} style={{ color: 'var(--color-blacklist)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff' }}>
              FLAG / BLACKLIST VEHICLE
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Dispatches a <code>POST /blacklist</code> payload to register a high-priority vehicle alert across all city ANPR cameras.
        </p>

        {statusMsg && (
          <div style={{
            padding: '10px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? 'var(--color-green)' : 'var(--color-red)'}`,
            color: statusMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
          }}>
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              LICENSE PLATE NUMBER
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%' }}
              placeholder="e.g. KA01AB1234"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              BLACKLIST REASON
            </label>
            <select
              className="search-input"
              style={{ width: '100%', cursor: 'pointer' }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="stolen vehicle">Stolen Vehicle</option>
              <option value="wanted for hit and run">Wanted for Hit and Run</option>
              <option value="fake license plate suspect">Fake License Plate Suspect</option>
              <option value="unpaid toll evader">Unpaid Toll Evader</option>
              <option value="court seizure order">Court Seizure Order</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="floating-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {submitting ? <span className="loading-spinner"></span> : <ShieldAlert size={14} />}
              <span>Blacklist Vehicle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
