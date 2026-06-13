const express = require('express');
const router = express.Router();

const {  getDashboard  } = require('../controllers/dasboardController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/stats', authenticate, adminAuth, getDashboard);

module.exports = router;