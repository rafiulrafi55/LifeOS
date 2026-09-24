function EventsSection({ events }) {
  return (
    <section className="section">
      <h1>Events</h1>
      {events.length === 0 ? <p className="empty-state">No events yet.</p> : (
        <ul className="record-list">
          {events.map((event) => (
            <li key={event.id} className="record-row">
              <div>
                <p className="record-title">{event.title}</p>
                {event.description && <p className="record-sub">{event.description}</p>}
                {event.location && <p className="record-sub">{event.location}</p>}
              </div>
              <div className="record-meta">
                <span>{new Date(event.start_at).toLocaleString()}</span>
                {event.end_at && <span>→ {new Date(event.end_at).toLocaleString()}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default EventsSection;
