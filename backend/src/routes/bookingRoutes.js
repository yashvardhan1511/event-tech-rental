const express = require('express');
const router = express.Router();
const { createBooking, getAllBookings, getBookingById, updateBookingStatus } = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.put('/:id', roleMiddleware(['admin', 'inventory_manager']), updateBookingStatus);

module.exports = router;
