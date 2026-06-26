const app = require('./app');
const db = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const testDbConnection = async () => {
  try {
    const [result] = await db.query('SELECT 1 + 1 AS result');
    console.log('Database connected successfully. Verification result:', result[0].result);
  } catch (error) {
    console.error('CRITICAL WARNING: Database connection failed. Please ensure MySQL is running and database configuration in .env is correct.');
    console.error(error.message);
  }
};

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await testDbConnection();
});
