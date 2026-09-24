import { useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const emptyForm = { title: '', content: '', tags: '' };

function NotesSection({ notes, userId, onNotesChange }) {
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [sort, setSort] = useState('updated');
  const [form, setForm] = useState(emptyForm);
  const [editingNote, setEditingNote] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tags = [...new Set(notes.flatMap((note) => note.tags || []))].sort();
  const visibleNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notes
      .filter((note) => {
        const searchable = [note.title, note.content, ...(note.tags || [])].join(' ').toLowerCase();
        return (!normalizedQuery || searchable.includes(normalizedQuery))
          && (tagFilter === 'all' || note.tags?.includes(tagFilter));
      })
      .sort((first, second) => {
        if (sort === 'title') return first.title.localeCompare(second.title);
        return new Date(second.updated_at) - new Date(first.updated_at);
      });
  }, [notes, query, sort, tagFilter]);

  function openCreate() {
    setEditingNote(null);
    setForm(emptyForm);
    setError('');
    setIsFormOpen(true);
  }

  function openEdit(note) {
    setEditingNote(note);
    setForm({ title: note.title, content: note.content, tags: (note.tags || []).join(', ') });
    setError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (!busy) setIsFormOpen(false);
  }

  function updateField(event) {
    setForm((currentForm) => ({ ...currentForm, [event.target.name]: event.target.value }));
  }

  async function saveNote(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Add a title before saving.');
      return;
    }

    const payload = {
      ...(editingNote ? {} : { user_id: userId }),
      title,
      content: form.content.trim(),
      tags: [...new Set(form.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
    };
    setBusy(true);
    setError('');
    const response = editingNote
      ? await supabase.from('notes').update(payload).eq('id', editingNote.id).select().single()
      : await supabase.from('notes').insert(payload).select().single();

    if (response.error) {
      setError(response.error.message);
      setBusy(false);
      return;
    }

    const nextNotes = editingNote
      ? notes.map((note) => note.id === editingNote.id ? response.data : note)
      : [response.data, ...notes];
    onNotesChange(nextNotes.sort((first, second) => new Date(second.updated_at) - new Date(first.updated_at)));
    setBusy(false);
    setIsFormOpen(false);
  }

  async function deleteNote(note) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    setError('');
    const response = await supabase.from('notes').delete().eq('id', note.id);
    if (response.error) {
      setError(response.error.message);
      return;
    }
    onNotesChange(notes.filter((currentNote) => currentNote.id !== note.id));
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your thinking space</p>
          <h1>Notes</h1>
        </div>
        <button className="submit-button notes-add-button" onClick={openCreate}><Plus size={16} /> New note</button>
      </div>

      <div className="notes-toolbar">
        <label className="notes-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." aria-label="Search notes" />
        </label>
        <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="Filter notes by tag">
          <option value="all">All tags</option>
          {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort notes">
          <option value="updated">Recently updated</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {error && <p className="status-message error">{error}</p>}
      {visibleNotes.length === 0 ? (
        <div className="notes-empty"><BookOpen size={22} /><p>{notes.length ? 'No notes match this search.' : 'No notes yet. Capture your first thought.'}</p></div>
      ) : (
        <div className="notes-grid">
          {visibleNotes.map((note) => (
            <article key={note.id} className="note-card">
              <div className="note-card-heading">
                <p className="record-title">{note.title}</p>
                <div className="note-actions">
                  <button className="icon-action" onClick={() => openEdit(note)} aria-label={`Edit ${note.title}`} title="Edit note"><Pencil size={15} /></button>
                  <button className="icon-action danger" onClick={() => deleteNote(note)} aria-label={`Delete ${note.title}`} title="Delete note"><Trash2 size={15} /></button>
                </div>
              </div>
              {note.content && <p className="record-sub note-content">{note.content}</p>}
              {note.tags?.length > 0 && <div className="record-meta">{note.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}</div>}
              <time className="note-date" dateTime={note.updated_at}>Updated {new Date(note.updated_at).toLocaleDateString()}</time>
            </article>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <div className="note-form-modal" role="dialog" aria-modal="true" aria-labelledby="note-form-title">
            <div className="modal-heading"><div><p className="eyebrow">{editingNote ? 'Refine an idea' : 'Capture an idea'}</p><h2 id="note-form-title">{editingNote ? 'Edit note' : 'New note'}</h2></div><button className="icon-action" onClick={closeForm} aria-label="Close note form"><X size={18} /></button></div>
            <form onSubmit={saveNote}>
              <label>Title<input name="title" value={form.title} onChange={updateField} placeholder="A clear title" autoFocus /></label>
              <label>Content<textarea name="content" value={form.content} onChange={updateField} placeholder="Write what is on your mind..." rows="7" /></label>
              <label>Tags <span className="field-hint">separate with commas</span><input name="tags" value={form.tags} onChange={updateField} placeholder="work, ideas, personal" /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancel</button><button type="submit" className="submit-button" disabled={busy}>{busy ? 'Saving...' : 'Save note'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default NotesSection;
