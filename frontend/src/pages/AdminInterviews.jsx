import { useState, useEffect } from 'react';
import client from '../api/client';

const DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];
const STATUSES = ['Scheduled', 'Completed', 'No-show'];

export default function AdminInterviews() {
  const [bookings, setBookings] = useState([]);
  const [domainFilter, setDomainFilter] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [slotForm, setSlotForm] = useState({ domain: '', panelist: '', startTime: '', endTime: '' });
  const [notesDraft, setNotesDraft] = useState({});

  async function load() {
    setError('');
    try {
      const params = domainFilter ? { domain: domainFilter } : {};
      const res = await client.get('/interviews/admin/bookings', { params });
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load bookings.');
    }
  }

  useEffect(() => { load(); }, [domainFilter]);

  async function createSlot(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!slotForm.domain || !slotForm.startTime || !slotForm.endTime) {
      setError('Domain, start time, and end time are required.');
      return;
    }
    try {
      await client.post('/interviews/slots', slotForm);
      setMessage('Slot created.');
      setSlotForm({ domain: '', panelist: '', startTime: '', endTime: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create slot.');
    }
  }

  async function updateStatus(bookingId, status) {
    try {
      await client.patch(`/interviews/admin/bookings/${bookingId}`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update status.');
    }
  }

  async function saveNotes(bookingId) {
    const notes = notesDraft[bookingId];
    try {
      await client.patch(`/interviews/admin/bookings/${bookingId}`, { notes });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save notes.');
    }
  }

  async function saveRating(bookingId, rating) {
    try {
      await client.patch(`/interviews/admin/bookings/${bookingId}`, { rating: Number(rating) });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save rating.');
    }
  }

  return (
    <div>
      <h1>Interviews</h1>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h3>Define a new slot</h3>
        <form onSubmit={createSlot}>
          <div className="row">
            <div className="field">
              <label>Domain</label>
              <select value={slotForm.domain} onChange={(e) => setSlotForm({ ...slotForm, domain: e.target.value })}>
                <option value="">Select domain</option>
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Panelist (optional)</label>
              <input type="text" value={slotForm.panelist} onChange={(e) => setSlotForm({ ...slotForm, panelist: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Start time</label>
              <input type="datetime-local" value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} />
            </div>
            <div className="field">
              <label>End time</label>
              <input type="datetime-local" value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary">Create slot</button>
        </form>
      </div>

      <div className="spread" style={{ marginTop: 24, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Bookings</h3>
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All domains</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">No interview bookings yet.</div>
      ) : (
        <div className="stack">
          {bookings.map((b) => (
            <div className="card" key={b.booking_id}>
              <div className="spread">
                <div>
                  <strong>{b.name}</strong> <span className="mono field-hint">{b.roll_number}</span>
                  <div className="field-hint">{b.domain}{b.panelist ? ` · ${b.panelist}` : ''}</div>
                </div>
                <span className={`badge badge-${b.status === 'No-show' ? 'noshow' : b.status.toLowerCase()}`}>{b.status}</span>
              </div>
              <div className="field-hint mono" style={{ marginTop: 6 }}>
                {new Date(b.start_time).toLocaleString()} – {new Date(b.end_time).toLocaleTimeString()}
              </div>

              <hr className="divider" />

              <div className="row" style={{ alignItems: 'flex-end' }}>
                <div className="field" style={{ minWidth: 160 }}>
                  <label>Status</label>
                  <select value={b.status} onChange={(e) => updateStatus(b.booking_id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field" style={{ minWidth: 120 }}>
                  <label>Rating (1-5)</label>
                  <select defaultValue={b.rating || ''} onChange={(e) => saveRating(b.booking_id, e.target.value)}>
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Interviewer notes (admin only)</label>
                <textarea
                  defaultValue={b.notes || ''}
                  onChange={(e) => setNotesDraft((d) => ({ ...d, [b.booking_id]: e.target.value }))}
                  onBlur={() => saveNotes(b.booking_id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
