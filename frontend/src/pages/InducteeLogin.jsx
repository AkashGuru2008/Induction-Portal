import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export default function InducteeLogin() {
  const [rollNumber, setRollNumber] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await client.post('/auth/inductee-login', { rollNumber, contact });
      login(res.data.token, 'inductee', res.data.inductee);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <div className="eyebrow">Inductee access</div>
      <h1>Log in</h1>
      <p>Use the roll number and the email or phone you applied with.</p>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Roll number</label>
            <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
          </div>
          <div className="field">
            <label>Email or phone</label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
