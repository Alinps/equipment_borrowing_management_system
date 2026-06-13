const express = require('express');
const router = express.Router();

const { 

    registerAdmin, 
    adminLogin, 
    listUsers, 
    blockUser, 
    createBorrower,
    editBorrower,
    listBorrower,
    deleteBorrower,
    borrowerById,
  

} = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.post('/register', registerAdmin);
router.post('/login', adminLogin);
router.get('/list',authenticate, adminAuth, listUsers);
router.put('/account-status/:id', authenticate, adminAuth, blockUser);
router.post('/create-borrower', authenticate, adminAuth, createBorrower);
router.put('/edit-borrower/:id', authenticate, adminAuth, editBorrower);
router.get('/list-borrower', authenticate, adminAuth, listBorrower);
router.delete('/delete/borrower/:id', authenticate, adminAuth, deleteBorrower);
router.get('/borrower/:id', authenticate, adminAuth, borrowerById);

module.exports = router;