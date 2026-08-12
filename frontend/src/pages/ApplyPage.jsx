import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const DOMAINS = ['DevOps', 'Corporate Communications', 'Creatives'];

export default function ApplyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', rollNumber: '', email: '', phone: '', pref1: '', pref2: '' });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const localErrors = [];
    if (!form.name.trim()) localErrors.push('Name is required.');
    if (!form.rollNumber.trim()) localErrors.push('Roll number is required.');
    if (!form.email.trim()) localErrors.push('Email is required.');
    if (!form.phone.trim()) localErrors.push('Phone is required.');
    if (!form.pref1) localErrors.push('First domain preference is required.');
    if (!form.pref2) localErrors.push('Second domain preference is required.');
    if (form.pref1 && form.pref2 && form.pref1 === form.pref2) {
      localErrors.push('First and second domain preferences must be different.');
    }
    if (localErrors.length) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await client.post('/applications', form);
      navigate('/confirmation', { state: { inductee: res.data.inductee } });
    } catch (err) {
      const apiErrors = err.response?.data?.errors || [err.response?.data?.error || 'Submission failed.'];
      setErrors(apiErrors);
    } finally {
      setSubmitting(false);
    }
  }

  const pref2Options = DOMAINS.filter((d) => d !== form.pref1);

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Apply for Induction</h1>
      <p>Fill in your details and pick exactly two domain preferences, ranked.</p>

      <div className="card">
        {errors.length > 0 && (
          <div className="alert alert-error">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Roll number</label>
            <input type="text" value={form.rollNumber} onChange={(e) => update('rollNumber', e.target.value)} />
          </div>
          <div className="row">
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
          </div>

          <hr className="divider" />

          <div className="row">
            <div className="field">
              <label>1st preference</label>
              <select value={form.pref1} onChange={(e) => update('pref1', e.target.value)}>
                <option value="">Select a domain</option>
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field">
              <label>2nd preference</label>
              <select value={form.pref2} onChange={(e) => update('pref2', e.target.value)}>
                <option value="">Select a domain</option>
                {pref2Options.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="field-hint">Must differ from your 1st preference.</div>
            </div>
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}
