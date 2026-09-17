const { supabase } = require('../supabaseClient');

const tableName = 'tasks';

const taskSchema = {
  id: 'string',
  user_id: 'string',
  title: 'string',
  description: 'string',
  status: 'string',
  priority: 'string',
  due_date: 'string',
  goal_id: 'string',
  created_at: 'string',
  updated_at: 'string',
};

const Task = {
  tableName,
  schema: taskSchema,

  findAll: () => supabase.from(tableName).select('*'),
  findById: (id) => supabase.from(tableName).select('*').eq('id', id).single(),
  create: (task) => supabase.from(tableName).insert(task).select().single(),
  update: (id, changes) => supabase.from(tableName).update(changes).eq('id', id).select().single(),
  remove: (id) => supabase.from(tableName).delete().eq('id', id),
};

module.exports = Task;