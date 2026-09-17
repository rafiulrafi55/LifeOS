function createCrudController(model) {
  return {
    list: async (req, res) => {
      const { data, error } = await model.findAll();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    },

    get: async (req, res) => {
      const { data, error } = await model.findById(req.params.id);
      if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
      return res.json(data);
    },

    create: async (req, res) => {
      const { user_id: ignoredUserId, ...attributes } = req.body || {};
      const { data, error } = await model.create({ ...attributes, user_id: req.user.id });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json(data);
    },

    update: async (req, res) => {
      const { user_id: ignoredUserId, ...changes } = req.body || {};
      const { data, error } = await model.update(req.params.id, changes);
      if (error) return res.status(error.code === 'PGRST116' ? 404 : 400).json({ error: error.message });
      return res.json(data);
    },

    remove: async (req, res) => {
      const { error } = await model.remove(req.params.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(204).send();
    },
  };
}

module.exports = { createCrudController };