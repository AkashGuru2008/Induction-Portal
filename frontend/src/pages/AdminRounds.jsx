import { useState, useEffect } from 'react';
import client from '../api/client';

export default function AdminRounds() {
  const [inductees, setInductees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('advance'); // 'advance' (mid-process) or 'final' (last round)

  async function load() {
    setError('');
    try {
      // Only inductees still active in the process are relevant here.
      const res = await client.get('/admin/inductees', { params: { status: 'pending' } });
      let all = res.data;
      const advancedRes = await client.get('/admin/inductees', { params: { status: 'advanced' } });
      all = [...all, ...advancedRes.data];
      setInductees(all);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load inductees.');
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submitAdvance(advance) {
    setError('');
    setMessage('');
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      setError('Select at least one inductee first.');
      return;
    }
    try {
      const body = advance ? { advanceIds: ids } : { rejectIds: ids };
      const res = await client.post('/rounds/advance', body);
      setMessage(`Updated ${(res.data.advanced || []).length + (res.data.rejected || []).length} inductee(s). Emails sent.`);
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update rounds.');
    }
  }

  async function submitFinal(select) {
    setError('');
    setMessage('');
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      setError('Select at least one inductee first.');
      return;
    }
    try {
      const body = select ? { selectedIds: ids } : { rejectedIds: ids };
      const res = await client.post('/rounds/announce-final', body);
      setMessage(`Announced results for ${(res.data.selected || []).length + (res.data.rejected || []).length} inductee(s). Emails sent.`);
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not announce results.');
    }
  }

  return (
    <div>
      <div className="eyebrow">Module F · Round progression & announcements</div>
      <h1>Rounds</h1>

      <div className="filters">
        <button className={`btn ${mode === 'advance' ? 'btn-primary' : ''}`} onClick={() => setMode('advance')}>Mid-process round</button>
        <button className={`btn ${mode === 'final' ? 'btn-primary' : ''}`} onClick={() => setMode('final')}>Final round announcement</button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {inductees.length === 0 ? (
          <div className="empty-state">No active inductees to process.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Roll no.</th>
                <th>Domain</th>
                <th>Round</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inductees.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => toggle(i.id)}>
                  <td><input type="checkbox" checked={selectedIds.has(i.id)} onChange={() => toggle(i.id)} /></td>
                  <td>{i.name}</td>
                  <td className="mono">{i.roll_number}</td>
                  <td>{i.assigned_domain || '—'}</td>
                  <td>{i.round}</td>
                  <td><span className={`badge badge-${i.status}`}>{i.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        {mode === 'advance' ? (
          <>
            <button className="btn btn-primary" onClick={() => submitAdvance(true)}>Advance selected to next round</button>
            <button className="btn btn-danger" onClick={() => submitAdvance(false)}>Reject selected</button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => submitFinal(true)}>Announce selected as inducted</button>
            <button className="btn btn-danger" onClick={() => submitFinal(false)}>Announce selected as rejected</button>
          </>
        )}
      </div>
      <p className="field-hint" style={{ marginTop: 10 }}>
        Selected inductees are notified by email immediately after you submit.
      </p>
    </div>
  );
}
