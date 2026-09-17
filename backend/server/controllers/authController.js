const User = require('../model/user');

async function signUp(req, res) {
  const { email, password, ...metadata } = req.body || {};
  const { data, error } = await User.signUp(email, password, { data: metadata });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
}

async function login(req, res) {
  const { email, username, password } = req.body || {};
  const loginIdentifier = username || email;
  const { data, error } = await User.loginWithIdentifier(loginIdentifier, password);
  if (error) return res.status(401).json({ error: error.message });
  return res.json(data);
}

async function logout(req, res) {
  const { error } = await User.logout();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
}

async function requestPasswordReset(req, res) {
  const { email, redirectTo } = req.body || {};
  const { error } = await User.sendPasswordResetEmail(email, redirectTo);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: 'Password reset email requested' });
}

module.exports = {
  signUp,
  login,
  logout,
  requestPasswordReset,
};