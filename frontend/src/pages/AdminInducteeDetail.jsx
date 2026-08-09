import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

const DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];

export default function AdminInducteeDetail() {
  const { id } = useParams();
  const [inductee, setInductee] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [assigning, setAssigning] = useState('');

  async function load() {
    setError('');
    try {
      const res = await client.get(`/admin/inductees/${id}`);
      setInductee(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load inductee.');
    }
  }

  useEffect(() => { load(); }, [id]);

  async function assignDomain() {
    if (!assigning) return;
    setMessage('');
    setError('');
    try {
      await client.patch(`/admin/inductees/${id}/assign-domain`, { domain: assigning });
      setMessage(`Assigned to ${assigning}. Notification email sent.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not assign domain.');
    }
  }

  if (error && !inductee) return <div className="alert alert-error">{error}</div>;
  if (!inductee) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 560 }}>
      <Link to="/admin/dashboard" className="field-hint">← Back to all inductees</Link>
      <div className="eyebrow" style={{ marginTop: 16 }}>Full application</div>
      <h1>{inductee.name}</h1>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="stack">
          <div className="spread"><span className="field-hint">Roll number</span><span className="mono">{inductee.roll_number}</span></div>
          <div className="spread"><span className="field-hint">Email</span><span>{inductee.email}</span></div>
          <div className="spread"><span className="field-hint">Phone</span><span>{inductee.phone}</span></div>
          <div className="spread"><span className="field-hint">1st preference</span><span>{inductee.pref1}</span></div>
          <div className="spread"><span className="field-hint">2nd preference</span><span>{inductee.pref2}</span></div>
          <div className="spread"><span className="field-hint">Round</span><span>{inductee.round}</span></div>
          <div className="spread"><span className="field-hint">Status</span><span className={`badge badge-${inductee.status}`}>{inductee.status}</span></div>
          <div className="spread"><span className="field-hint">Applied</span><span className="mono">{new Date(inductee.created_at).toLocaleString()}</span></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Domain assignment</h3>
        <p>Current: <strong>{inductee.assigned_domain || 'Not assigned'}</strong></p>
        <div className="row">
          <select value={assigning} onChange={(e) => setAssigning(e.target.value)} style={{ flex: 1 }}>
            <option value="">Choose domain…</option>
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-primary" onClick={assignDomain} disabled={!assigning}>Assign & notify</button>
        </div>
      </div>
    </div>
  );
}
