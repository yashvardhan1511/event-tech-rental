const express = require('express');
const router = express.Router();
const { generateRecommendations } = require('../utils/recommendationEngine');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  const { type, attendees, venue_size, budget, start_date, end_date, event_name, special_requirements } = req.body;
  if (!type || !attendees || !venue_size || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing fields for recommendation calculation.' });
  }

  try {
    const recommendations = await generateRecommendations(
      type,
      parseInt(attendees),
      venue_size,
      budget ? parseFloat(budget) : null,
      start_date,
      end_date,
      event_name,
      special_requirements
    );
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating equipment recommendations.' });
  }
});

module.exports = router;
