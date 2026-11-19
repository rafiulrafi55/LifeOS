import { useState } from 'react';
import { CheckSquare, Pencil, Plus, Square, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const statuses = ['active', 'completed', 'paused', 'cancelled'];
const emptyForm = { title: '', description: '', status: 'active', progress: 0, target_date: '' };

function label(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function GoalsSection({ goals, userId, onGoalsChange }) {
  const [form, setForm] = useState(emptyForm);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function openCreate() {
    setEditingGoal(null);
    setForm(emptyForm);
    setError('');
    setIsFormOpen(true);
  }

  function openEdit(goal) {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description || '',
      status: goal.status,
      progress: goal.progress,
      target_date: goal.target_date || '',
    });
    setError('');
    setIsFormOpen(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'progress' ? Math.min(100, Math.max(0, parseInt(value) || 0)) : value
    }));
  }

  function closeForm() {
    if (!busy) setIsFormOpen(false);
  }

  async function saveGoal(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Please provide a goal title.');
      return;
    }

    setBusy(true);
    setError('');
    const payload = {
      ...(editingGoal ? {} : { user_id: userId }),
      title,
      description: form.description.trim(),
      status: form.status,
      progress: form.progress,
      target_date: form.target_date || null,
    };
    const response = editingGoal
      ? await supabase.from('goals').update(payload).eq('id', editingGoal.id).select().single()
      : await supabase.from('goals').insert(payload).select().single();

    if (response.error) {
      setError(response.error.message);
      setBusy(false);
      return;
    }

    const nextGoals = editingGoal
      ? goals.map((g) => g.id === editingGoal.id ? response.data : g)
      : [response.data, ...goals];
    onGoalsChange(nextGoals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setBusy(false);
    setIsFormOpen(false);
  }

  async function removeGoal(goal) {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;
    setError('');
    const response = await supabase.from('goals').delete().eq('id', goal.id);
    if (response.error) {
      setError(response.error.message);
      return;
    }
    onGoalsChange(goals.filter((g) => g.id !== goal.id));
  }

  async function toggleStatus(goal) {
    const status = goal.status === 'completed' ? 'active' : 'completed';
    const progress = status === 'completed' ? 100 : goal.progress;
    const response = await supabase.from('goals').update({ status, progress }).eq('id', goal.id).select().single();
    if (response.error) {
      setError(response.error.message);
      return;
    }
    onGoalsChange(goals.map((g) => g.id === goal.id ? response.data : g));
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Set your sights</p>
          <h1>Goals</h1>
        </div>
        <button className="submit-button notes-add-button" onClick={openCreate}><Plus size={16} /> New goal</button>
      </div>

      {error && <p className="status-message error">{error}</p>}
      {goals.length === 0 ? <p className="empty-state">No goals yet.</p> : (
        <ul className="record-list">
          {goals.map((goal) => (
            <li key={goal.id} className="record-row">
              <button className="icon-action" onClick={() => toggleStatus(goal)} aria-label={goal.status === 'completed' ? `Reactivate ${goal.title}` : `Complete ${goal.title}`} title={goal.status === 'completed' ? 'Reactivate goal' : 'Complete goal'}>
                {goal.status === 'completed' ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              <div className="workspace-main">
                <p className="record-title">{goal.title}</p>
                {goal.description && <p className="record-sub">{goal.description}</p>}
                <div className="progress-track"><div className="progress-fill" style={{ width: `${goal.progress}%` }} /></div>
              </div>
              <div className="record-meta">
                <span className="badge">{label(goal.status)}</span>
                <span className="badge">{goal.progress}%</span>
                {goal.target_date && <span>{new Date(goal.target_date).toLocaleDateString()}</span>}
                <button className="icon-action" onClick={() => openEdit(goal)} aria-label={`Edit ${goal.title}`} title="Edit goal"><Pencil size={15} /></button>
                <button className="icon-action danger" onClick={() => removeGoal(goal)} aria-label={`Delete ${goal.title}`} title="Delete goal"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <div className="note-form-modal" role="dialog" aria-modal="true" aria-labelledby="goal-form-title">
            <div className="modal-heading">
              <div><p className="eyebrow">Define ambition</p><h2 id="goal-form-title">{editingGoal ? 'Edit goal' : 'New goal'}</h2></div>
              <button className="icon-action" onClick={closeForm} aria-label="Close form"><X size={18} /></button>
            </div>
            <form onSubmit={saveGoal}>
              <label>Title<input name="title" value={form.title} onChange={updateField} placeholder="What do you want to achieve?" autoFocus /></label>
              <label>Description<textarea name="description" value={form.description} onChange={updateField} placeholder="Add useful context..." rows="3" /></label>
              <label>Status<select name="status" value={form.status} onChange={updateField}>{statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label>
              <label>Progress (%)<input name="progress" type="number" min="0" max="100" value={form.progress} onChange={updateField} /></label>
              <label>Deadline<input name="target_date" type="date" value={form.target_date} onChange={updateField} /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancel</button><button type="submit" className="submit-button" disabled={busy}>{busy ? 'Saving...' : 'Save goal'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default GoalsSection;
