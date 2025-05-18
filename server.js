// 1. Import required modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

// 2. Initialize Express application
const app = express();
const port = 3000;

// 3. Initialize SQLite database
const db = new sqlite3.Database('./sensor.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// 4. Create database table (if it doesn't exist)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL,
      humidity REAL,
      air_quality REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Failed to create table:', err.message);
    else console.log('Table "sensor_data" is ready.');
  });
});

// 5. Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 6. API Endpoints

// POST endpoint to add new sensor data
app.post('/api/data', (req, res) => {
  const { temperature, humidity, air_quality } = req.body;

  if (
    temperature === undefined || 
    humidity === undefined || 
    air_quality === undefined
  ) {
    return res.status(400).json({ error: 'Missing one or more sensor fields.' });
  }

  // Get current IST time
  const now = new Date();
  const istOffset = 330 * 60000; // 5 hours 30 minutes in ms
  const istTime = new Date(now.getTime() + istOffset);
  const timestamp = istTime.toISOString();

  db.run(
    'INSERT INTO sensor_data (temperature, humidity, air_quality, timestamp) VALUES (?, ?, ?, ?)',
    [temperature, humidity, air_quality, timestamp],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database insert failed', details: err.message });
      }
      res.status(201).json({
        message: 'Data saved successfully!',
        timestamp: timestamp
      });
    }
  );
});

// GET endpoint to fetch the latest sensor reading
app.get('/api/latest', (req, res) => {
  db.get(
    "SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1",
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch latest data', details: err.message });
      }
      res.json(row || {
        temperature: null,
        humidity: null,
        air_quality: null
      });
    }
  );
});

// GET endpoint to fetch the latest 100 entries
app.get('/api/data', (req, res) => {
  db.all(
    "SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100",
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch data', details: err.message });
      }
      res.json(rows);
    }
  );
});

// 7. Start the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log('📡 Available endpoints:');
  console.log('POST /api/data - Add new sensor data');
  console.log('GET  /api/latest - Get latest reading');
  console.log('GET  /api/data - Get historical data');
});
