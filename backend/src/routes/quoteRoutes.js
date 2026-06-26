const express = require('express');
const router = express.Router();
const { createQuote, getAllQuotes, getQuoteById, updateQuoteStatus, sendQuoteEmail } = require('../controllers/quoteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createQuote);
router.get('/', getAllQuotes);
router.get('/:id', getQuoteById);
router.put('/:id/status', updateQuoteStatus);
router.post('/:id/send-email', sendQuoteEmail);

module.exports = router;
