import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      <div className="eyebrow">Cohort intake · open</div>
      <h1>Induction Portal</h1>
      <p style={{ maxWidth: 560, fontSize: '1rem' }}>
        Apply for induction, track your progress through review, domain assignment,
        interviews, and final results — all in one place.
      </p>

      <div className="split" style={{ marginTop: 32 }}>
        <div className="card">
          <h3>Applying for the first time?</h3>
          <p>Submit your application with your domain preferences.</p>
          <Link to="/apply" className="btn btn-primary btn-block">Start application</Link>
        </div>
        <div className="card">
          <h3>Already applied?</h3>
          <p>Log in with your roll number to check status, view tasks, and book interviews.</p>
          <Link to="/login" className="btn btn-block">Inductee login</Link>
        </div>
      </div>
    </div>
  );
}
