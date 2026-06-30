const db = require('../config/db');

const getRevenueAnalytics = async (req, res) => {
  try {
    // 1. Total revenue (sum of quotes of confirmed/completed/in_progress bookings)
    const revenueQuery = `
      SELECT SUM(q.total) AS total_revenue
      FROM bookings b
      JOIN quotes q ON b.quote_id = q.id
      WHERE b.status IN ('confirmed', 'in_progress', 'completed', 'pending')
    `;
    const [revResult] = await db.query(revenueQuery);
    const totalRevenue = parseFloat(revResult[0].total_revenue || '0');

    // 2. Active booking count
    const activeBookingsQuery = `
      SELECT COUNT(*) AS active_count
      FROM bookings
      WHERE status IN ('confirmed', 'in_progress', 'pending')
    `;
    const [activeResult] = await db.query(activeBookingsQuery);
    const activeCount = parseInt(activeResult[0].active_count || '0');

    // 3. Total equipment items
    const equipmentQuery = `
      SELECT COUNT(*) AS equip_count FROM equipment
    `;
    const [equipResult] = await db.query(equipmentQuery);
    const totalEquipment = parseInt(equipResult[0].equip_count || '0');

    // 4. Monthly revenue for the past 6 months
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(b.created_at, '%Y-%m') AS month,
        SUM(q.total) AS revenue,
        COUNT(b.id) AS bookings_count
      FROM bookings b
      JOIN quotes q ON b.quote_id = q.id
      WHERE b.status IN ('confirmed', 'in_progress', 'completed', 'pending')
        AND b.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `;
    const [monthlyResult] = await db.query(monthlyQuery);

    res.json({
      summary: {
        totalRevenue,
        activeBookings: activeCount,
        totalEquipment
      },
      monthlyRevenue: monthlyResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving revenue analytics.' });
  }
};

const getEquipmentUtilization = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id,
        e.name,
        e.category,
        e.total_quantity,
        CAST(COALESCE(SUM(be.quantity), 0) AS SIGNED) AS total_rented,
        COUNT(be.id) AS rental_frequency,
        ROUND(LEAST(100.0, (COALESCE(SUM(be.quantity), 0.0) / CAST(e.total_quantity AS DECIMAL(10,2))) * 100.0), 1) AS utilization_rate
      FROM equipment e
      LEFT JOIN booking_equipment be ON e.id = be.equipment_id
      LEFT JOIN bookings b ON be.booking_id = b.id AND b.status IN ('confirmed', 'in_progress', 'completed', 'pending')
      GROUP BY e.id
      ORDER BY utilization_rate DESC
      LIMIT 10
    `;
    const [utilization] = await db.query(query);
    res.json(utilization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving equipment utilization analytics.' });
  }
};

module.exports = {
  getRevenueAnalytics,
  getEquipmentUtilization
};
