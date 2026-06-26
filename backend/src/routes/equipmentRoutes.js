const express = require('express');
const router = express.Router();
const { getAllEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', getAllEquipment);
router.get('/:id', getEquipmentById);

// Admin & Inventory Manager roles can mutate equipment
router.post('/', authMiddleware, roleMiddleware(['admin', 'inventory_manager']), createEquipment);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'inventory_manager']), updateEquipment);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'inventory_manager']), deleteEquipment);

module.exports = router;
