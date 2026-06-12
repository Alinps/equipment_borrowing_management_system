const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');


const { 

    borrowEquipment,
    returnEquipment,
    getActiveBorrowings,
    getBorrowHistory,
    getBorrowerHistory

} = require('../controllers/borrowController');

router.post('/create', authenticate, adminAuth, borrowEquipment);
router.patch('/return/:id', authenticate, adminAuth, returnEquipment);
router.get('/borrow-records/active', authenticate, adminAuth, getActiveBorrowings);
router.get('/borrower-records', authenticate,adminAuth, getBorrowHistory );
router.get('/borrower-records/:id', authenticate, adminAuth, getBorrowerHistory);

module.exports = router;