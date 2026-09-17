const Profile = require('../model/profile');

async function getProfile(req, res) {
  const { data, error } = await Profile.findByUserId(req.user.id);
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
  return res.json(data);
}

async function updateProfile(req, res) {
  const { user_id: ignoredUserId, id: ignoredId, ...changes } = req.body || {};
  const { data: profile, error: findError } = await Profile.findByUserId(req.user.id);
  if (findError) return res.status(findError.code === 'PGRST116' ? 404 : 500).json({ error: findError.message });

  const { data, error } = await Profile.update(profile.id, changes);
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
}

module.exports = {
  getProfile,
  updateProfile,
};