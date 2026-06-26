const db = require('../config/db');

const getAllEquipment = async (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    if (start_date && end_date) {
      const query = `
        SELECT e.*,
          CAST(GREATEST(0, e.total_quantity - COALESCE(
            (SELECT SUM(be.quantity)
             FROM booking_equipment be
             JOIN bookings b ON be.booking_id = b.id
             JOIN events ev ON b.event_id = ev.id
             WHERE be.equipment_id = e.id
               AND b.status IN ('confirmed', 'in_progress', 'pending')
               AND NOT (ev.end_date < ? OR ev.start_date > ?)
            ), 0)
          ) AS SIGNED) AS available_quantity
        FROM equipment e
        WHERE e.status = 'active'
      `;
      const [equipment] = await db.query(query, [end_date, start_date]);
      
      // Parse JSON specifications
      const mapped = equipment.map(item => ({
        ...item,
        specifications: typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications
      }));
      res.json(mapped);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const query = `
        SELECT e.*,
          CAST(GREATEST(0, e.total_quantity - COALESCE(
            (SELECT SUM(be.quantity)
             FROM booking_equipment be
             JOIN bookings b ON be.booking_id = b.id
             JOIN events ev ON b.event_id = ev.id
             WHERE be.equipment_id = e.id
               AND b.status IN ('confirmed', 'in_progress', 'pending')
               AND NOT (ev.end_date < ? OR ev.start_date > ?)
            ), 0)
          ) AS SIGNED) AS available_quantity
        FROM equipment e
      `;
      const [equipment] = await db.query(query, [today, today]);
      const mapped = equipment.map(item => ({
        ...item,
        specifications: typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications
      }));
      res.json(mapped);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving equipment.' });
  }
};

const getEquipmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [equipment] = await db.query('SELECT * FROM equipment WHERE id = ?', [id]);
    if (equipment.length === 0) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }
    const item = equipment[0];
    item.specifications = typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications;
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving equipment details.' });
  }
};

const createEquipment = async (req, res) => {
  const { name, category, description, daily_rate, total_quantity, image_url, specifications, status } = req.body;
  if (!name || !category || daily_rate === undefined || total_quantity === undefined) {
    return res.status(400).json({ message: 'Name, category, daily rate, and total quantity are required.' });
  }

  try {
    const specsString = specifications ? JSON.stringify(specifications) : JSON.stringify({});
    const [result] = await db.query(
      'INSERT INTO equipment (name, category, description, daily_rate, total_quantity, image_url, specifications, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category, description, daily_rate, total_quantity, image_url, specsString, status || 'active']
    );

    res.status(201).json({
      message: 'Equipment created successfully.',
      equipmentId: result.insertId,
      equipment: { id: result.insertId, name, category, description, daily_rate, total_quantity, image_url, specifications, status: status || 'active' }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating equipment.' });
  }
};

const updateEquipment = async (req, res) => {
  const { id } = req.params;
  const { name, category, description, daily_rate, total_quantity, image_url, specifications, status } = req.body;

  if (!name || !category || daily_rate === undefined || total_quantity === undefined) {
    return res.status(400).json({ message: 'Name, category, daily rate, and total quantity are required.' });
  }

  try {
    const specsString = specifications ? JSON.stringify(specifications) : JSON.stringify({});
    await db.query(
      'UPDATE equipment SET name = ?, category = ?, description = ?, daily_rate = ?, total_quantity = ?, image_url = ?, specifications = ?, status = ? WHERE id = ?',
      [name, category, description, daily_rate, total_quantity, image_url, specsString, status || 'active', id]
    );

    res.json({
      message: 'Equipment updated successfully.',
      equipment: { id, name, category, description, daily_rate, total_quantity, image_url, specifications, status }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating equipment.' });
  }
};

const deleteEquipment = async (req, res) => {
  const { id } = req.params;
  try {
    const checkQuery = `
      SELECT COUNT(*) AS active_bookings
      FROM booking_equipment be
      JOIN bookings b ON be.booking_id = b.id
      WHERE be.equipment_id = ? AND b.status IN ('confirmed', 'in_progress', 'pending')
    `;
    const [check] = await db.query(checkQuery, [id]);
    if (check[0].active_bookings > 0) {
      return res.status(400).json({
        message: 'Cannot delete equipment. It is currently booked for upcoming events. Try setting status to retired instead.'
      });
    }

    await db.query('DELETE FROM equipment WHERE id = ?', [id]);
    res.json({ message: 'Equipment deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting equipment.' });
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
};
