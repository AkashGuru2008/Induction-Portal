import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

const DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];
const STATUSES = ['pending', 'advanced', 'rejected', 'selected'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [inductees, setInductees] = useState([]);
  const [domain, setDomain] = useState('');
  const [prefRank, setPrefRank] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (domain) params.domain = domain;
      if (prefRank) params.prefRank = prefRank;
      if (status) params.status = status;
      const res = await client.get('/admin/inductees', { params });
      setInductees(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load inductees.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [domain, prefRank, status]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (domain) params.set('domain', domain);
    if (prefRank) params.set('prefRank', prefRank);
    if (status) params.set('status', status);
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/inductees/export/csv?${params}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'inductees_export.csv';
        link.click();
      });
  }

  return (
    <div>
      <div className="spread">
        <h1>Inductees</h1>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="filters">
        <select value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="">All domains</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={prefRank} onChange={(e) => setPrefRank(e.target.value)} disabled={!domain}>
          <option value="">Any preference rank</option>
          <option value="1">1st choice</option>
          <option value="2">2nd choice</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 24 }}>Loading…</p>
        ) : inductees.length === 0 ? (
          <div className="empty-state">No inductees match these filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll no.</th>
                <th>Preferences</th>
                <th>Assigned</th>
                <th>Round</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inductees.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => navigate(`/admin/inductees/${i.id}`)}>
                  <td>{i.name}</td>
                  <td className="mono">{i.roll_number}</td>
                  <td>{i.pref1} / {i.pref2}</td>
                  <td>{i.assigned_domain || '—'}</td>
                  <td>{i.round}</td>
                  <td><span className={`badge badge-${i.status}`}>{i.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Domain boards</h3>
        <p>Post tasks and answer Q&A per domain.</p>
        <div className="row">
          {DOMAINS.map((d) => (
            <Link key={d} to={`/admin/domain/${encodeURIComponent(d)}`} className="btn" style={{ flex: 1, minWidth: 160 }}>
              {d}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
