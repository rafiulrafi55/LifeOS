function NotesSection({ notes }) {
  return (
    <section className="section">
      <h1>Notes</h1>
      {notes.length === 0 ? <p className="empty-state">No notes yet.</p> : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <p className="record-title">{note.title}</p>
              <p className="record-sub">{note.content}</p>
              {note.tags?.length > 0 && (
                <div className="record-meta">
                  {note.tags.map((tag) => <span key={tag} className="badge">{tag}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default NotesSection;
