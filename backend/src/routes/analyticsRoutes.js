const express = require('express');
const router = express.Router();
const { getRevenueAnalytics, getEquipmentUtilization } = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'inventory_manager']));

router.get('/revenue', getRevenueAnalytics);
router.get('/utilization', getEquipmentUtilization);

module.exports = router;
