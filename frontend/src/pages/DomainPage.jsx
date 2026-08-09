import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';

export default function DomainPage() {
  const { domain } = useParams();
  const [tasks, setTasks] = useState([]);
  const [qna, setQna] = useState([]);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [tasksRes, qnaRes] = await Promise.all([
        client.get(`/domain/${encodeURIComponent(domain)}/tasks`),
        client.get(`/domain/${encodeURIComponent(domain)}/qna`),
      ]);
      setTasks(tasksRes.data);
      setQna(qnaRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load domain page.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [domain]);

  async function submitQuestion(e) {
    e.preventDefault();
    if (!question.trim()) return;
    try {
      await client.post(`/domain/${encodeURIComponent(domain)}/qna`, { question });
      setQuestion('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post question.');
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="eyebrow">Module C · Domain board</div>
      <h1>{domain}</h1>

      <div className="split">
        <div className="card">
          <h3>Tasks</h3>
          {tasks.length === 0 && <div className="empty-state">No tasks posted yet.</div>}
          {tasks.map((t) => (
            <div className="task-item" key={t.id}>
              <div className="task-title">{t.title}</div>
              {t.description && <p style={{ margin: '4px 0' }}>{t.description}</p>}
              {t.deadline && <div className="task-deadline">Due {new Date(t.deadline).toLocaleString()}</div>}
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Q&A</h3>
          <form onSubmit={submitQuestion} className="stack" style={{ marginBottom: 16 }}>
            <textarea placeholder="Ask a question…" value={question} onChange={(e) => setQuestion(e.target.value)} />
            <button className="btn btn-primary">Post question</button>
          </form>
          <hr className="divider" />
          {qna.length === 0 && <div className="empty-state">No questions yet — be the first to ask.</div>}
          {qna.map((q) => (
            <div className="q-item" key={q.id}>
              <div className="q-meta">{q.roll_number} · {new Date(q.created_at).toLocaleDateString()}</div>
              <div className="q-question">{q.question}</div>
              {q.answer ? (
                <div className="q-answer">{q.answer}</div>
              ) : (
                <div className="field-hint">Awaiting admin response…</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
