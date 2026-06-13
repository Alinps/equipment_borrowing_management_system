var express = require('express');
var router = express.Router();
const { createEquipment, updateEquipment, deleteEquipment, listEquipment,  getEquipmentById, getAllEquipmentNameAndId } = require('../controllers/equipmentController');
const  authenticate  = require('../middleware/auth');
const  adminAuth =  require('../middleware/adminAuth');


router.post('/create', authenticate, adminAuth, createEquipment);
router.put('/update/:id', authenticate, adminAuth, updateEquipment);
router.delete('/delete/:id', authenticate, adminAuth, deleteEquipment);
router.get('/list', authenticate, listEquipment);
router.get('/get-equipment/:id', authenticate, adminAuth, getEquipmentById);
router.get('/list-equipment', authenticate, adminAuth, getAllEquipmentNameAndId );

module.exports = router;