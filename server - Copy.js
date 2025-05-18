const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Initialize SQLite DB
const db = new sqlite3.Database('./sensor.db');

// Create table (if not exists)
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS sensor_data (id INTEGER PRIMARY KEY AUTOINCREMENT, temperature REAL, humidity REAL, air_quality REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

app.use(bodyParser.json());
app.use(express.static('public'));

// API to insert data
app.post('/api/data', (req, res) => {
  const { temperature, humidity, air_quality } = req.body;
  db.run("INSERT INTO sensor_data (temperature, humidity, air_quality) VALUES (?, ?, ?)", [temperature, humidity, air_quality]);
  res.send('Data saved');
});

// API to fetch data
app.get('/api/data', (req, res) => {
  db.all("SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100", [], (err, rows) => {
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});