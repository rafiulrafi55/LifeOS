const { supabase } = require('../supabaseClient');

const tableName = 'goals';

const goalSchema = {
  id: 'string',
  user_id: 'string',
  title: 'string',
  description: 'string',
  status: 'string',
  progress: 'number',
  target_date: 'string',
  created_at: 'string',
  updated_at: 'string',
};

const Goal = {
  tableName,
  schema: goalSchema,

  findAll: () => supabase.from(tableName).select('*'),
  findById: (id) => supabase.from(tableName).select('*').eq('id', id).single(),
  create: (goal) => supabase.from(tableName).insert(goal).select().single(),
  update: (id, changes) => supabase.from(tableName).update(changes).eq('id', id).select().single(),
  remove: (id) => supabase.from(tableName).delete().eq('id', id),
};

module.exports = Goal;