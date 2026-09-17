const { supabase } = require('../supabaseClient');

const tableName = 'dashboards';

const dashboardSchema = {
  id: 'string',
  user_id: 'string',
  layout: 'object',
  widgets: 'array',
  created_at: 'string',
  updated_at: 'string',
};

const Dashboard = {
  tableName,
  schema: dashboardSchema,

  findAll: () => supabase.from(tableName).select('*'),
  findById: (id) => supabase.from(tableName).select('*').eq('id', id).single(),
  create: (dashboard) => supabase.from(tableName).insert(dashboard).select().single(),
  update: (id, changes) => supabase.from(tableName).update(changes).eq('id', id).select().single(),
  remove: (id) => supabase.from(tableName).delete().eq('id', id),
};

module.exports = Dashboard;