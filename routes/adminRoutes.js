const express = require('express');
const router = express.Router();

const { registerAdmin, adminLogin, listUsers, blockUser } = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.post('/register', registerAdmin);
router.post('/login', adminLogin);
router.get('/list',authenticate, adminAuth, listUsers);
router.put('/account-status/:id', authenticate, adminAuth, blockUser);

module.exports = router;