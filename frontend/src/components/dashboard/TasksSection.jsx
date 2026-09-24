function TasksSection({ tasks }) {
  return (
    <section className="section">
      <h1>Tasks</h1>
      {tasks.length === 0 ? <p className="empty-state">No tasks yet.</p> : (
        <ul className="record-list">
          {tasks.map((task) => (
            <li key={task.id} className="record-row">
              <div>
                <p className="record-title">{task.title}</p>
                {task.description && <p className="record-sub">{task.description}</p>}
              </div>
              <div className="record-meta">
                <span className="badge">{task.priority}</span>
                <span className="badge">{task.status}</span>
                {task.due_date && <span>{new Date(task.due_date).toLocaleDateString()}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TasksSection;
