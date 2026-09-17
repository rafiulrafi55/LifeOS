const { supabase } = require('../supabaseClient');

const tableName = 'notes';

const noteSchema = {
  id: 'string',
  user_id: 'string',
  title: 'string',
  content: 'string',
  tags: 'array',
  created_at: 'string',
  updated_at: 'string',
};

const Note = {
  tableName,
  schema: noteSchema,

  findAll: () => supabase.from(tableName).select('*'),
  findById: (id) => supabase.from(tableName).select('*').eq('id', id).single(),
  create: (note) => supabase.from(tableName).insert(note).select().single(),
  update: (id, changes) => supabase.from(tableName).update(changes).eq('id', id).select().single(),
  remove: (id) => supabase.from(tableName).delete().eq('id', id),
};

module.exports = Note;