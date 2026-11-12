import { useMemo, useState } from 'react';
import { Check, CheckSquare, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const priorityRank = { low: 1, medium: 2, high: 3, urgent: 4 };
const emptyForm = { title: '', description: '', status: 'pending', priority: 'medium', due_date: '' };

function label(value) {
  return value.replace('_', ' ');
}

function TasksSection({ tasks, userId, onTasksChange }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('due_date');
  const [form, setForm] = useState(emptyForm);
  const [editingTask, setEditingTask] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const visibleTasks = useMemo(() => {
    const search = query.trim().toLowerCase();
    return tasks
      .filter((task) => {
        const text = `${task.title} ${task.description || ''}`.toLowerCase();
        return (!search || text.includes(search))
          && (statusFilter === 'all' || task.status === statusFilter);
      })
      .sort((first, second) => {
        if (sort === 'title') return first.title.localeCompare(second.title);
        if (sort === 'priority') return (priorityRank[second.priority] || 0) - (priorityRank[first.priority] || 0);
        if (!first.due_date) return 1;
        if (!second.due_date) return -1;
        return new Date(first.due_date) - new Date(second.due_date);
      });
  }, [tasks, query, sort, statusFilter]);

  function openCreate() {
    setEditingTask(null);
    setForm(emptyForm);
    setError('');
    setIsFormOpen(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      due_date: task.due_date || '',
    });
    setError('');
    setIsFormOpen(true);
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function closeForm() {
    if (!busy) setIsFormOpen(false);
  }

  async function saveTask(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Add a title before saving.');
      return;
    }

    setBusy(true);
    setError('');
    const payload = {
      ...(editingTask ? {} : { user_id: userId }),
      title,
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
    };
    const response = editingTask
      ? await supabase.from('tasks').update(payload).eq('id', editingTask.id).select().single()
      : await supabase.from('tasks').insert(payload).select().single();

    if (response.error) {
      setError(response.error.message);
      setBusy(false);
      return;
    }

    const nextTasks = editingTask
      ? tasks.map((task) => task.id === editingTask.id ? response.data : task)
      : [...tasks, response.data];
    onTasksChange(nextTasks);
    setBusy(false);
    setIsFormOpen(false);
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setError('');
    const response = await supabase.from('tasks').delete().eq('id', task.id);
    if (response.error) {
      setError(response.error.message);
      return;
    }
    onTasksChange(tasks.filter((current) => current.id !== task.id));
  }

  async function toggleComplete(task) {
    const status = task.status === 'completed' ? 'pending' : 'completed';
    const response = await supabase.from('tasks').update({ status }).eq('id', task.id).select().single();
    if (response.error) {
      setError(response.error.message);
      return;
    }
    onTasksChange(tasks.map((current) => current.id === task.id ? response.data : current));
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Make progress visible</p>
          <h1>Tasks</h1>
        </div>
        <button className="submit-button notes-add-button" onClick={openCreate}><Plus size={16} /> New task</button>
      </div>

      <div className="notes-toolbar">
        <label className="notes-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter tasks by status">
          <option value="all">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort tasks">
          <option value="due_date">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {error && <p className="status-message error">{error}</p>}
      {visibleTasks.length === 0 ? (
        <p className="empty-state">{tasks.length ? 'No tasks match this search.' : 'No tasks yet.'}</p>
      ) : (
        <ul className="record-list">
          {visibleTasks.map((task) => (
            <li key={task.id} className="record-row">
              <button className="icon-action" onClick={() => toggleComplete(task)} aria-label={task.status === 'completed' ? `Reopen ${task.title}` : `Complete ${task.title}`} title={task.status === 'completed' ? 'Reopen task' : 'Complete task'}>
                {task.status === 'completed' ? <CheckSquare size={18} /> : <Check size={18} />}
              </button>
              <div className="workspace-main">
                <p className="record-title">{task.title}</p>
                {task.description && <p className="record-sub">{task.description}</p>}
              </div>
              <div className="record-meta">
                <span className="badge">{task.priority}</span>
                <span className="badge">{label(task.status || 'pending')}</span>
                {task.due_date && <span>{new Date(`${task.due_date}T00:00:00`).toLocaleDateString()}</span>}
                <button className="icon-action" onClick={() => openEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task"><Pencil size={15} /></button>
                <button className="icon-action danger" onClick={() => removeTask(task)} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <div className="note-form-modal" role="dialog" aria-modal="true" aria-labelledby="task-form-title">
            <div className="modal-heading">
              <div><p className="eyebrow">{editingTask ? 'Keep moving forward' : 'Plan the next step'}</p><h2 id="task-form-title">{editingTask ? 'Edit task' : 'New task'}</h2></div>
              <button className="icon-action" onClick={closeForm} aria-label="Close task form"><X size={18} /></button>
            </div>
            <form onSubmit={saveTask}>
              <label>Title<input name="title" value={form.title} onChange={updateField} placeholder="What needs to be done?" autoFocus /></label>
              <label>Description<textarea name="description" value={form.description} onChange={updateField} placeholder="Add useful context..." rows="4" /></label>
              <label>Priority<select name="priority" value={form.priority} onChange={updateField}>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
              <label>Status<select name="status" value={form.status} onChange={updateField}>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
              <label>Due date<input name="due_date" type="date" value={form.due_date} onChange={updateField} /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancel</button><button type="submit" className="submit-button" disabled={busy}>{busy ? 'Saving...' : 'Save task'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default TasksSection;
