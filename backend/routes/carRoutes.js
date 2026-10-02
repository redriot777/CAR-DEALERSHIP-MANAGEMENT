const express = require('express');
const pool = require('../db');

const router = express.Router();

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const STATUSES = ['Available', 'Reserved', 'Sold', 'Under Service'];
const MIN_YEAR = 1990;

// ---- Validation (the backend never trusts the frontend) ----
function validateCar(body) {
  const errors = [];
  const b = body || {};
  const text = (v) => (typeof v === 'string' ? v.trim() : '');

  const brand = text(b.brand);
  const model = text(b.model);
  const variant = text(b.variant);
  const fuel_type = text(b.fuel_type);
  const transmission = text(b.transmission);
  const status = text(b.status);
  const year = Number(b.manufacturing_year);
  const price = Number(b.price);

  if (!brand) errors.push('Brand is required.');
  else if (brand.length > 100) errors.push('Brand must be 100 characters or fewer.');
  if (!model) errors.push('Model is required.');
  else if (model.length > 100) errors.push('Model must be 100 characters or fewer.');
  if (!variant) errors.push('Variant is required.');
  else if (variant.length > 100) errors.push('Variant must be 100 characters or fewer.');

  const maxYear = new Date().getFullYear() + 1;
  if (b.manufacturing_year === '' || b.manufacturing_year == null || !Number.isInteger(year) || year < MIN_YEAR || year > maxYear) {
    errors.push(`Manufacturing year must be a whole number between ${MIN_YEAR} and ${maxYear}.`);
  }
  if (!FUEL_TYPES.includes(fuel_type)) errors.push(`Fuel type must be one of: ${FUEL_TYPES.join(', ')}.`);
  if (!TRANSMISSIONS.includes(transmission)) errors.push(`Transmission must be one of: ${TRANSMISSIONS.join(', ')}.`);
  if (b.price === '' || b.price == null || !Number.isFinite(price) || price <= 0 || price >= 1e10) {
    errors.push('Price must be a number greater than 0.');
  }
  if (!STATUSES.includes(status)) errors.push(`Status must be one of: ${STATUSES.join(', ')}.`);

  return {
    errors,
    values: [brand, model, variant, year, fuel_type, transmission, Math.round(price * 100) / 100, status],
  };
}

function parseId(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    res.status(400).json({ message: 'Car ID must be a positive whole number.' });
    return null;
  }
  return Number(req.params.id);
}

function handleError(err, res) {
  console.error(err);
  const dbDown = ['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST'];
  if (dbDown.includes(err.code)) {
    return res.status(500).json({ message: 'Database error: check that MySQL is running, the .env credentials are correct and the SQL script has been run.' });
  }
  res.status(500).json({ message: 'Something went wrong on the server.' });
}

const COLUMNS = 'brand, model, variant, manufacturing_year, fuel_type, transmission, price, status';

// GET /api/cars - all cars
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cars ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (err) { handleError(err, res); }
});

// GET /api/cars/:id - one car
router.get('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  try {
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Car not found.' });
    res.status(200).json(rows[0]);
  } catch (err) { handleError(err, res); }
});

// POST /api/cars - create
router.post('/', async (req, res) => {
  const { errors, values } = validateCar(req.body);
  if (errors.length) return res.status(400).json({ message: 'Invalid car data.', errors });
  try {
    const [result] = await pool.query(
      `INSERT INTO cars (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, values);
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { handleError(err, res); }
});

// PUT /api/cars/:id - update
router.put('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { errors, values } = validateCar(req.body);
  if (errors.length) return res.status(400).json({ message: 'Invalid car data.', errors });
  try {
    const [result] = await pool.query(
      `UPDATE cars SET brand = ?, model = ?, variant = ?, manufacturing_year = ?,
       fuel_type = ?, transmission = ?, price = ?, status = ? WHERE id = ?`, [...values, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Car not found.' });
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
  } catch (err) { handleError(err, res); }
});

// DELETE /api/cars/:id - delete
router.delete('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  try {
    const [result] = await pool.query('DELETE FROM cars WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Car not found.' });
    res.status(200).json({ message: 'Car deleted successfully.' });
  } catch (err) { handleError(err, res); }
});

module.exports = router;
