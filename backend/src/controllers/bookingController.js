const db = require('../config/db');

const createBooking = async (req, res) => {
  const { quote_id } = req.body;
  const userId = req.user.id;

  if (!quote_id) {
    return res.status(400).json({ message: 'Quote ID is required to create a booking.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch quote details
    const [quotes] = await connection.query('SELECT * FROM quotes WHERE id = ?', [quote_id]);
    if (quotes.length === 0) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    const quote = quotes[0];
    if (quote.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. You do not own this quote.' });
    }

    // Check if booking already exists for this quote
    const [existing] = await connection.query('SELECT * FROM bookings WHERE quote_id = ?', [quote_id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A booking already exists for this quote.', bookingId: existing[0].id });
    }

    // 2. Insert into bookings
    const [bookingResult] = await connection.query(
      'INSERT INTO bookings (quote_id, event_id, user_id, status, payment_status) VALUES (?, ?, ?, ?, ?)',
      [quote_id, quote.event_id, quote.user_id, 'confirmed', 'unpaid']
    );
    const bookingId = bookingResult.insertId;

    // 3. Update Quote status to approved
    await connection.query('UPDATE quotes SET status = ? WHERE id = ?', ['approved', quote_id]);

    // 4. Insert items into booking_equipment for availability checks
    const bundleDetails = typeof quote.bundle_details === 'string' ? JSON.parse(quote.bundle_details) : quote.bundle_details;

    for (const item of bundleDetails) {
      await connection.query(
        'INSERT INTO booking_equipment (booking_id, equipment_id, quantity) VALUES (?, ?, ?)',
        [bookingId, item.equipment_id, item.quantity]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: 'Booking confirmed successfully.',
      bookingId: bookingId
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error confirming booking.' });
  } finally {
    connection.release();
  }
};

const getAllBookings = async (req, res) => {
  const { id, role } = req.user;

  try {
    let query = `
      SELECT b.*, 
             e.name AS event_name, e.type AS event_type, e.start_date, e.end_date,
             u.username,
             q.total
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN users u ON b.user_id = u.id
      JOIN quotes q ON b.quote_id = q.id
    `;
    let params = [];

    if (role === 'customer') {
      query += ' WHERE b.user_id = ?';
      params.push(id);
    }

    query += ' ORDER BY b.created_at DESC';

    const [bookings] = await db.query(query, params);
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving bookings.' });
  }
};

const getBookingById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const query = `
      SELECT b.*, 
             e.name AS event_name, e.type AS event_type, e.start_date, e.end_date, e.attendees, e.venue_size, e.special_requirements,
             u.username, u.email AS user_email,
             q.bundle_details, q.subtotal, q.discount, q.total
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN users u ON b.user_id = u.id
      JOIN quotes q ON b.quote_id = q.id
      WHERE b.id = ?
    `;
    const [bookings] = await db.query(query, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookings[0];

    if (role === 'customer' && booking.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    booking.bundle_details = typeof booking.bundle_details === 'string' ? JSON.parse(booking.bundle_details) : booking.bundle_details;
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving booking details.' });
  }
};

const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;

  try {
    let updateFields = [];
    let params = [];

    if (status) {
      if (!['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid booking status.' });
      }
      updateFields.push('status = ?');
      params.push(status);
    }

    if (payment_status) {
      if (!['unpaid', 'partially_paid', 'paid'].includes(payment_status)) {
        return res.status(400).json({ message: 'Invalid payment status.' });
      }
      updateFields.push('payment_status = ?');
      params.push(payment_status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Nothing to update.' });
    }

    params.push(id);
    const query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;

    await db.query(query, params);
    res.json({ message: 'Booking updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating booking status.' });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus
};
