const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');
const { createCrudRouter } = require('./routes/crudRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const Dashboard = require('./model/dashboard');
const Goal = require('./model/goal');
const Task = require('./model/task');
const Note = require('./model/note');
const Finance = require('./model/finance');
const Event = require('./model/event');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

app.use('/api/profiles', requireAuth, profileRoutes);
app.use('/api/dashboards', requireAuth, createCrudRouter(Dashboard));
app.use('/api/goals', requireAuth, createCrudRouter(Goal));
app.use('/api/tasks', requireAuth, createCrudRouter(Task));
app.use('/api/notes', requireAuth, createCrudRouter(Note));
app.use('/api/finances', requireAuth, createCrudRouter(Finance));
app.use('/api/events', requireAuth, createCrudRouter(Event));

if (require.main === module) {
	app.listen(port, () => {
		console.log(`LifeOS API listening on port ${port}`);
	});
}

module.exports = { app };
