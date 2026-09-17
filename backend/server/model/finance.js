const { supabase } = require('../supabaseClient');

const tableName = 'finances';

const financeSchema = {
  id: 'string',
  user_id: 'string',
  type: 'string',
  amount: 'number',
  category: 'string',
  description: 'string',
  transaction_date: 'string',
  created_at: 'string',
  updated_at: 'string',
};

const Finance = {
  tableName,
  schema: financeSchema,

  findAll: () => supabase.from(tableName).select('*'),
  findById: (id) => supabase.from(tableName).select('*').eq('id', id).single(),
  create: (finance) => supabase.from(tableName).insert(finance).select().single(),
  update: (id, changes) => supabase.from(tableName).update(changes).eq('id', id).select().single(),
  remove: (id) => supabase.from(tableName).delete().eq('id', id),
};

module.exports = Finance;