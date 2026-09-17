const { supabase } = require('../supabaseClient');

const tableName = 'events';

const eventSchema = {
  id: 'string',
  user_id: 'string',
  title: 'string',
  description: 'string',
  start_at: 'string',
  end_at: 'string',
  location: 'string',
  created_at: 'string',
  updated_at: 'string',
};

const Event = {
  tableName,
  schema: eventSchema,

  findAll: () => supabase.from(tableName).select('*'),
  findById: (id) => supabase.from(tableName).select('*').eq('id', id).single(),
  create: (event) => supabase.from(tableName).insert(event).select().single(),
  update: (id, changes) => supabase.from(tableName).update(changes).eq('id', id).select().single(),
  remove: (id) => supabase.from(tableName).delete().eq('id', id),
};

module.exports = Event;