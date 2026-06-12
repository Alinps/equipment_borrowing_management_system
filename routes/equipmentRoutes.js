var express = require('express');
var router = express.Router();
const { createEquipment, updateEquipment, deleteEquipment, listEquipment } = require('../controllers/equipmentController');
const  authenticate  = require('../middleware/auth');
const  adminAuth =  require('../middleware/adminAuth');


router.post('/create', authenticate, adminAuth, createEquipment);
router.put('/update/:id', authenticate, adminAuth, updateEquipment);
router.delete('/delete/:id', authenticate, adminAuth, deleteEquipment);
router.get('/list', authenticate, listEquipment);

module.exports = router;