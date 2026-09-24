function GoalsSection({ goals }) {
  return (
    <section className="section">
      <h1>Goals</h1>
      {goals.length === 0 ? <p className="empty-state">No goals yet.</p> : (
        <ul className="record-list">
          {goals.map((goal) => (
            <li key={goal.id} className="record-row">
              <div>
                <p className="record-title">{goal.title}</p>
                {goal.description && <p className="record-sub">{goal.description}</p>}
                <div className="progress-track"><div className="progress-fill" style={{ width: `${goal.progress}%` }} /></div>
              </div>
              <div className="record-meta">
                <span className="badge">{goal.status}</span>
                <span>{goal.progress}%</span>
                {goal.target_date && <span>{new Date(goal.target_date).toLocaleDateString()}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default GoalsSection;
