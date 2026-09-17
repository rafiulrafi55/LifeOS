const { supabase } = require('../supabaseClient');

const tableName = 'profiles';

const profileSchema = {
  id: 'string',
  user_id: 'string',
  username: 'string',
  first_name: 'string',
  last_name: 'string',
  avatar_url: 'string',
  timezone: 'string',
  created_at: 'string',
  updated_at: 'string',
};

const Profile = {
  tableName,
  schema: profileSchema,

  findAll: () => supabase.from(tableName).select('*'),
  findById: (id) => supabase.from(tableName).select('*').eq('id', id).single(),
  findByUserId: (userId) => supabase.from(tableName).select('*').eq('user_id', userId).single(),
  create: (profile) => supabase.from(tableName).insert(profile).select().single(),
  update: (id, changes) => supabase.from(tableName).update(changes).eq('id', id).select().single(),
  remove: (id) => supabase.from(tableName).delete().eq('id', id),
};

module.exports = Profile;