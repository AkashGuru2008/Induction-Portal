import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function AdminDomainBoard() {
  const { domain } = useParams();
  const [tasks, setTasks] = useState([]);
  const [qna, setQna] = useState([]);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '' });
  const [answers, setAnswers] = useState({});

  async function load() {
    setError('');
    try {
      const [tasksRes, qnaRes] = await Promise.all([
        client.get(`/domain/${encodeURIComponent(domain)}/tasks`),
        client.get(`/domain/${encodeURIComponent(domain)}/qna`),
      ]);
      setTasks(tasksRes.data);
      setQna(qnaRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load domain board.');
    }
  }

  useEffect(() => { load(); }, [domain]);

  async function postTask(e) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await client.post(`/domain/${encodeURIComponent(domain)}/tasks`, newTask);
      setNewTask({ title: '', description: '', deadline: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post task.');
    }
  }

  async function postAnswer(qId) {
    const text = answers[qId];
    if (!text || !text.trim()) return;
    try {
      await client.post(`/domain/${encodeURIComponent(domain)}/qna/${qId}/answer`, { answer: text });
      setAnswers((a) => ({ ...a, [qId]: '' }));
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post answer.');
    }
  }

  return (
    <div>
      <Link to="/admin/dashboard" className="field-hint">← Back to dashboard</Link>
      <h1>{domain}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="split">
        <div className="card">
          <h3>Post a task</h3>
          <form onSubmit={postTask} className="stack">
            <input type="text" placeholder="Title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
            <textarea placeholder="Description (optional)" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
            <div className="field">
              <label>Deadline</label>
              <input type="datetime-local" value={newTask.deadline} onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })} />
            </div>
            <button className="btn btn-primary">Post task</button>
          </form>

          <hr className="divider" />
          {tasks.length === 0 && <div className="empty-state">No tasks yet.</div>}
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
          {qna.length === 0 && <div className="empty-state">No questions yet.</div>}
          {qna.map((q) => (
            <div className="q-item" key={q.id}>
              <div className="q-meta">{q.name} ({q.roll_number}) · {new Date(q.created_at).toLocaleDateString()}</div>
              <div className="q-question">{q.question}</div>
              {q.answer ? (
                <div className="q-answer">{q.answer}</div>
              ) : (
                <div className="row" style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Write a reply…"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-sm" onClick={() => postAnswer(q.id)}>Reply</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
