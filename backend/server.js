const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Replace with your host if different
  user: process.env.DB_USER, // Replace with your MySQL username
  password: process.env.DB_PASSWORD, // Replace with your MySQL password
  database: process.env.DB_NAME, // Replace with your database name
  port: process.env.DB_PORT, // Default MySQL port
});

/** Compatible con MySQL/MariaDB sin ADD COLUMN IF NOT EXISTS (8.0.12+) */
const ensureColumn = async (connection, name, definition) => {
  const [rows] = await connection.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'destinations' AND COLUMN_NAME = ?`,
    [name]
  );
  if (rows.length === 0) {
    await connection.query(`ALTER TABLE destinations ADD COLUMN \`${name}\` ${definition}`);
  }
};

// Ensure the table exists
const createTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS destinations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      country VARCHAR(255) NOT NULL,
      capital VARCHAR(255),
      population BIGINT,
      region VARCHAR(255),
      currencies VARCHAR(255),
      anthem text
    );
  `;
  try {
    const connection = await pool.getConnection();
    await connection.query(createTableQuery);
    // Migración suave si la tabla ya existía sin columnas nuevas
    await ensureColumn(connection, 'currencies', 'VARCHAR(255)');
    await ensureColumn(connection, 'anthem', 'TEXT');
    connection.release();
    console.log('Table "destinations" ensured.');
  } catch (err) {
    console.error('Error ensuring table "destinations":', err.message);
    process.exit(1); // Exit the app if the table creation fails
  }
};

// Initialize the table on server startup
createTable();

// Routes
app.get('/api/destinations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM destinations ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/destinations', async (req, res) => {
  const { country } = req.body;
  try {
    // Fetch country data from external API
    const response = await axios.get(`${process.env.COUNTRIES_API_BASE_URL}/name/${encodeURIComponent(country)}`);
const countryInfo = response.data[0];

// Validar si existe el país
if (!response.data || response.data.length === 0) {
  return res.status(404).json({ error: "Country not found" });
}

// Manejo seguro de datos
const capital = countryInfo.capital ? countryInfo.capital[0] : "N/A";
const population = countryInfo.population || 0;
const region = countryInfo.region || "N/A";
const currencies = JSON.stringify(countryInfo.currencies || {});
const anthem = countryInfo.anthem || "No disponible";

// Insertar en BD
const [result] = await pool.query(
  'INSERT INTO destinations (country, capital, population, region, currencies, anthem) VALUES (?, ?, ?, ?, ?, ?)',
  [country, capital, population, region, currencies, anthem]
);

// Respuesta
res.status(201).json({
  id: result.insertId,
  country,
  capital,
  population,
  region,
  currencies,
  anthem
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/destinations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM destinations WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
