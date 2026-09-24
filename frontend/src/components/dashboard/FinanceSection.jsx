function FinanceSection({ finances }) {
  const income = finances.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expense = finances.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <section className="section">
      <h1>Finance</h1>
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

      {finances.length === 0 ? <p className="empty-state">No transactions yet.</p> : (
        <ul className="record-list">
          {finances.map((entry) => (
            <li key={entry.id} className="record-row">
              <div>
                <p className="record-title">{entry.category}</p>
                {entry.description && <p className="record-sub">{entry.description}</p>}
              </div>
              <div className="record-meta">
                <span className="badge">{entry.type}</span>
                <span className={entry.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                  {entry.type === 'income' ? '+' : '-'}${Number(entry.amount).toFixed(2)}
                </span>
                <span>{new Date(entry.transaction_date).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default FinanceSection;
