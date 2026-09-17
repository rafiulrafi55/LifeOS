const express = require('express');
const { createCrudController } = require('../controllers/crudController');

function createCrudRouter(model) {
  const router = express.Router();
  const controller = createCrudController(model);

  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}

module.exports = { createCrudRouter };