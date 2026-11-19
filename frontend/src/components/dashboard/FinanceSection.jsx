import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const emptyForm = { type: 'expense', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] };
const types = ['income', 'expense'];

function label(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function FinanceSection({ finances, userId, onFinancesChange }) {
  const [form, setForm] = useState(emptyForm);
  const [editingFinance, setEditingFinance] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const income = finances.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expense = finances.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + Number(entry.amount), 0);

  function openCreate() {
    setEditingFinance(null);
    setForm(emptyForm);
    setError('');
    setIsFormOpen(true);
  }

  function openEdit(entry) {
    setEditingFinance(entry);
    setForm({
      type: entry.type,
      amount: entry.amount,
      category: entry.category,
      description: entry.description || '',
      transaction_date: entry.transaction_date,
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

  async function saveFinance(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.category.trim() || isNaN(amount) || amount <= 0) {
      setError('Please provide a valid category and amount');
      return;
    }

    setBusy(true);
    setError('');
    const payload = {
      ...(editingFinance ? {} : { user_id: userId }),
      type: form.type,
      amount,
      category: form.category.trim(),
      description: form.description.trim(),
      transaction_date: form.transaction_date,
    };
    const response = editingFinance
      ? await supabase.from('finances').update(payload).eq('id', editingFinance.id).select().single()
      : await supabase.from('finances').insert(payload).select().single();

    if (response.error) {
      setError(response.error.message);
      setBusy(false);
      return;
    }

    const nextFinances = editingFinance
      ? finances.map((entry) => entry.id === editingFinance.id ? response.data : entry)
      : [response.data, ...finances];
    onFinancesChange(nextFinances.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)));
    setBusy(false);
    setIsFormOpen(false);
  }

  async function removeFinance(entry) {
    if (!window.confirm(`Delete "${entry.category}" transaction?`)) return;
    setError('');
    const response = await supabase.from('finances').delete().eq('id', entry.id);
    if (response.error) {
      setError(response.error.message);
      return;
    }
    onFinancesChange(finances.filter((current) => current.id !== entry.id));
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Track your money</p>
          <h1>Finance</h1>
        </div>
        <button className="submit-button notes-add-button" onClick={openCreate}><Plus size={16} /> New transaction</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <p className="card-label">Income</p>
          <p className="card-value">${income.toFixed(2)}</p>
        </div>
        <div className="dashboard-card">
          <p className="card-label">Expenses</p>
          <p className="card-value">${expense.toFixed(2)}</p>
        </div>
        <div className="dashboard-card">
          <p className="card-label">Net balance</p>
          <p className="card-value">${(income - expense).toFixed(2)}</p>
        </div>
      </div>

      {error && <p className="status-message error">{error}</p>}
      {finances.length === 0 ? <p className="empty-state">No transactions yet.</p> : (
        <ul className="record-list">
          {finances.map((entry) => (
            <li key={entry.id} className="record-row">
              <div>
                <p className="record-title">{entry.category}</p>
                {entry.description && <p className="record-sub">{entry.description}</p>}
              </div>
              <div className="record-meta">
                <span className="badge">{label(entry.type)}</span>
                <span className={entry.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                  {entry.type === 'income' ? '+' : '-'}${Number(entry.amount).toFixed(2)}
                </span>
                <span>{new Date(entry.transaction_date).toLocaleDateString()}</span>
                <button className="icon-action" onClick={() => openEdit(entry)} aria-label={`Edit ${entry.category}`} title="Edit transaction"><Pencil size={15} /></button>
                <button className="icon-action danger" onClick={() => removeFinance(entry)} aria-label={`Delete ${entry.category}`} title="Delete transaction"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <div className="note-form-modal" role="dialog" aria-modal="true" aria-labelledby="finance-form-title">
            <div className="modal-heading">
              <div><p className="eyebrow">Financial record</p><h2 id="finance-form-title">{editingFinance ? 'Edit transaction' : 'New transaction'}</h2></div>
              <button className="icon-action" onClick={closeForm} aria-label="Close form"><X size={18} /></button>
            </div>
            <form onSubmit={saveFinance}>
              <div className="field-row">
                <label>Type<select name="type" className="profile-select" value={form.type} onChange={updateField}>{types.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select></label>
                <label>Amount<input name="amount" type="number" step="0.01" value={form.amount} onChange={updateField} placeholder="0.00" autoFocus /></label>
              </div>
              <label>Category<input name="category" value={form.category} onChange={updateField} placeholder="e.g. Salary, Rent, Food" /></label>
              <label>Description<input name="description" value={form.description} onChange={updateField} placeholder="Optional details..." /></label>
              <label>Date<input name="transaction_date" type="date" value={form.transaction_date} onChange={updateField} /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancel</button><button type="submit" className="submit-button" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default FinanceSection;
