// server.js

// 1. Required Modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

// 2. Express Setup
const app = express();
const port = process.env.PORT || 3000;

// 3. Database Setup
const db = new sqlite3.Database('./sensor.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL,
      humidity REAL,
      air_quality REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// 4. Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 5. API Routes

// POST new data
app.post('/api/data', (req, res) => {
  const { temperature, humidity, air_quality } = req.body;

  if (
    temperature === undefined ||
    humidity === undefined ||
    air_quality === undefined
  ) {
    return res.status(400).json({ error: 'Missing one or more sensor fields.' });
  }

  const now = new Date();
  const istOffset = 330 * 60000;
  const istTime = new Date(now.getTime() + istOffset);

  db.run(
    'INSERT INTO sensor_data (temperature, humidity, air_quality, timestamp) VALUES (?, ?, ?, ?)',
    [temperature, humidity, air_quality, istTime.toISOString()],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Data saved successfully!', timestamp: istTime.toISOString() });
    }
  );
});

// GET latest reading
app.get('/api/latest', (req, res) => {
  db.get(
    'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1',
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || { temperature: null, humidity: null, air_quality: null });
    }
  );
});

// GET all data (latest 100)
app.get('/api/data', (req, res) => {
  db.all(
    'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 6. Fallback route for direct browser hits (Render fix)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. Start Server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
