const express = require('express');
const {
  signUp,
  login,
  logout,
  requestPasswordReset,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/password-reset', requestPasswordReset);

module.exports = router;