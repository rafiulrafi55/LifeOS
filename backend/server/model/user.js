const { supabase } = require('../supabaseClient');

const userSchema = {
  id: 'string',
  email: 'string',
  username: 'string',
  first_name: 'string',
  last_name: 'string',
  phone: 'string',
  created_at: 'string',
  updated_at: 'string',
};

const User = {
  schema: userSchema,

  signUp: (email, password, options = {}) => supabase.auth.signUp({
    email,
    password,
    options,
  }),

  login: (email, password) => supabase.auth.signInWithPassword({
    email,
    password,
  }),

  resolveLoginEmail: (loginIdentifier) => supabase.rpc('resolve_login_email', {
    login_identifier: loginIdentifier,
  }),

  loginWithIdentifier: async (loginIdentifier, password) => {
    if (!loginIdentifier || !loginIdentifier.trim()) {
      return { data: null, error: { message: 'Missing email or username' } };
    }

    const { data: email, error } = await User.resolveLoginEmail(loginIdentifier);
    if (error || !email) {
      return { data: null, error: error || { message: 'Invalid email or username' } };
    }
    return User.login(email, password);
  },

  logout: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  getCurrentUser: () => supabase.auth.getUser(),

  refreshSession: () => supabase.auth.refreshSession(),

  sendPasswordResetEmail: (email, redirectTo) => supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  ),

  updatePassword: (password) => supabase.auth.updateUser({ password }),

  resendVerificationEmail: (email) => supabase.auth.resend({
    type: 'signup',
    email,
  }),
};

module.exports = User;

