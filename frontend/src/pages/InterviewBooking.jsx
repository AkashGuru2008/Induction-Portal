import { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export default function InterviewBooking() {
  const { profile } = useAuth();
  const [myBooking, setMyBooking] = useState(null);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const bookingRes = await client.get('/interviews/my-booking');
      setMyBooking(bookingRes.data);

      if (!bookingRes.data) {
        const domain = profile?.assignedDomain;
        const params = domain ? { domain, onlyAvailable: 'true' } : { onlyAvailable: 'true' };
        const slotsRes = await client.get('/interviews/slots', { params });
        setSlots(slotsRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load interview data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function book(slotId) {
    setError('');
    setMessage('');
    try {
      await client.post('/interviews/book', { slotId });
      setMessage('Interview booked! A confirmation email is on its way.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not book slot.');
      load();
    }
  }

  async function cancel() {
    if (!window.confirm('Cancel your interview booking?')) return;
    setError('');
    try {
      await client.delete('/interviews/my-booking');
      setMessage('Booking cancelled.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel booking.');
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="eyebrow">Module D · Interview scheduling</div>
      <h1>Interview</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {myBooking ? (
        <div className="card">
          <h3>Your scheduled interview</h3>
          <div className="stack">
            <div className="spread"><span className="field-hint">Domain</span><span>{myBooking.domain}</span></div>
            <div className="spread"><span className="field-hint">Time</span><span className="mono">{new Date(myBooking.start_time).toLocaleString()} – {new Date(myBooking.end_time).toLocaleTimeString()}</span></div>
            {myBooking.panelist && <div className="spread"><span className="field-hint">Panelist</span><span>{myBooking.panelist}</span></div>}
          </div>
          <p className="field-hint" style={{ marginTop: 14 }}>You'll get a reminder email ahead of the interview.</p>
          <button className="btn btn-danger" onClick={cancel}>Cancel booking</button>
        </div>
      ) : (
        <div className="card">
          <h3>Pick a slot</h3>
          {!profile?.assignedDomain && (
            <div className="alert alert-info">Showing all open slots — you haven't been assigned a domain yet.</div>
          )}
          {slots.length === 0 && <div className="empty-state">No open slots right now. Check back later.</div>}
          <div className="slot-grid">
            {slots.map((s) => (
              <div key={s.id} className="slot-card" onClick={() => book(s.id)}>
                <div className="slot-time">{new Date(s.start_time).toLocaleString()}</div>
                <div className="slot-domain">{s.domain}{s.panelist ? ` · ${s.panelist}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
