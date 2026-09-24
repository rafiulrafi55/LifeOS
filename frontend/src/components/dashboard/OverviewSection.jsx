function OverviewSection({ data, displayName }) {
  const pendingTasks = data.tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled');
  const completedTasks = data.tasks.filter((task) => task.status === 'completed');
  const activeGoals = data.goals.filter((goal) => goal.status === 'active');
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length)
    : 0;
  const income = data.finances.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expense = data.finances.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const balance = income - expense;
  const upcomingEvents = data.events.filter((event) => new Date(event.start_at) >= new Date()).slice(0, 5);

  return (
    <section className="dashboard">
      <div className="dashboard-greeting">
        <p className="eyebrow">Welcome back</p>
        <h1>Good to see you, {displayName}.</h1>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <p className="card-label">Tasks</p>
          <p className="card-value">{pendingTasks.length}</p>
          <p className="card-sub">{completedTasks.length} completed</p>
        </div>
        <div className="dashboard-card">
          <p className="card-label">Active goals</p>
          <p className="card-value">{activeGoals.length}</p>
          <p className="card-sub">{avgProgress}% avg progress</p>
        </div>
        <div className="dashboard-card">
          <p className="card-label">Balance</p>
          <p className="card-value">${balance.toFixed(2)}</p>
          <p className="card-sub">${income.toFixed(2)} in · ${expense.toFixed(2)} out</p>
        </div>
        <div className="dashboard-card">
          <p className="card-label">Upcoming events</p>
          <p className="card-value">{upcomingEvents.length}</p>
          <p className="card-sub">{upcomingEvents[0] ? new Date(upcomingEvents[0].start_at).toLocaleDateString() : 'Nothing scheduled'}</p>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-panel">
          <h2>Upcoming tasks</h2>
          {pendingTasks.length === 0 ? <p className="empty-state">No pending tasks.</p> : (
            <ul>
              {pendingTasks.slice(0, 5).map((task) => (
                <li key={task.id}>
                  <span>{task.title}</span>
                  <span className="badge">{task.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Upcoming events</h2>
          {upcomingEvents.length === 0 ? <p className="empty-state">No upcoming events.</p> : (
            <ul>
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <span>{event.title}</span>
                  <span>{new Date(event.start_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Recent notes</h2>
          {data.notes.length === 0 ? <p className="empty-state">No notes yet.</p> : (
            <ul>
              {data.notes.slice(0, 5).map((note) => (
                <li key={note.id}><span>{note.title}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default OverviewSection;
