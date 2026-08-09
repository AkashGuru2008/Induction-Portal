import { useLocation, Link } from 'react-router-dom';

export default function ConfirmationPage() {
  const { state } = useLocation();
  const inductee = state?.inductee;

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="eyebrow">Application received</div>
      <h1>You're in the queue.</h1>

      {inductee ? (
        <div className="card">
          <p style={{ color: 'var(--ink)' }}>
            Thanks, <strong>{inductee.name}</strong>. A confirmation email is on its way to you.
          </p>
          <hr className="divider" />
          <div className="stack">
            <div className="spread"><span className="field-hint">Roll number</span><span className="mono">{inductee.rollNumber}</span></div>
            <div className="spread"><span className="field-hint">1st preference</span><span>{inductee.pref1}</span></div>
            <div className="spread"><span className="field-hint">2nd preference</span><span>{inductee.pref2}</span></div>
          </div>
          <hr className="divider" />
          <p style={{ fontSize: '0.85rem' }}>
            Log in anytime with your roll number and the email/phone you applied with to check
            your status, view tasks, and book an interview once assigned.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">Go to inductee login</Link>
        </div>
      ) : (
        <div className="card">
          <p>No application data found — if you just applied, check your email for confirmation.</p>
          <Link to="/apply" className="btn">Back to application form</Link>
        </div>
      )}
    </div>
  );
}
