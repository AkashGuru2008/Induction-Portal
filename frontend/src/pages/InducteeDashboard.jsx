import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  pending: 'Under review',
  advanced: 'Advanced to next round',
  rejected: 'Not selected',
  selected: 'Selected 🎉',
};

export default function InducteeDashboard() {
  const { profile } = useAuth();

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="eyebrow">Your status</div>
      <h1>Hi, {profile?.name || 'there'}.</h1>

      <div className="card">
        <div className="stack">
          <div className="spread">
            <span className="field-hint">Roll number</span>
            <span className="mono">{profile?.rollNumber}</span>
          </div>
          <div className="spread">
            <span className="field-hint">Current round</span>
            <span>{profile?.round}</span>
          </div>
          <div className="spread">
            <span className="field-hint">Application status</span>
            <span className={`badge badge-${profile?.status}`}>{STATUS_LABELS[profile?.status] || profile?.status}</span>
          </div>
          <div className="spread">
            <span className="field-hint">Assigned domain</span>
            <span>{profile?.assignedDomain || 'Not yet assigned'}</span>
          </div>
        </div>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Domain board</h3>
          <p>Tasks and Q&A for your assigned domain.</p>
          {profile?.assignedDomain ? (
            <Link to={`/domain/${encodeURIComponent(profile.assignedDomain)}`} className="btn btn-primary btn-block">
              Open {profile.assignedDomain}
            </Link>
          ) : (
            <button className="btn btn-block" disabled>Awaiting domain assignment</button>
          )}
        </div>
        <div className="card">
          <h3>Interview</h3>
          <p>Book a slot once one is available for your domain.</p>
          <Link to="/interview" className="btn btn-primary btn-block">Manage interview</Link>
        </div>
      </div>
    </div>
  );
}
