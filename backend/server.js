const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const carRoutes = require('./routes/carRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// REST API
app.use('/api/cars', carRoutes);
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));

// Serve the single-page frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Central error handler (bad JSON, unexpected errors)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log(`Connected to MySQL database "${process.env.DB_NAME || 'car_dealership'}".`);
  } catch (err) {
    console.error(`Could not connect to MySQL (${err.code || err.message}).`);
    console.error('Check your .env file and make sure MySQL is running and the SQL script has been run.');
  }
});
