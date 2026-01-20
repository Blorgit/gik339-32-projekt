const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

/* ---------- Middleware ---------- */

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- Database ---------- */

const db = new sqlite3.Database('./movies.db', (err) => {
  if (err) {
    console.error('DB error:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    director TEXT,
    year INTEGER,
    rating INTEGER,
    thumbnail TEXT
  )
`);

/* ---------- API Endpoints ---------- */

/* GET all movies */
app.get('/movies', (req, res) => {
  db.all('SELECT * FROM movies', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/* GET one movie */
app.get('/movies/:id', (req, res) => {
  db.get(
    'SELECT * FROM movies WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      res.json(row);
    }
  );
});

/* CREATE movie */
app.post('/movies', (req, res) => {
  const { title, director, year, rating, thumbnail } = req.body;

  db.run(
    `INSERT INTO movies (title, director, year, rating, thumbnail)
     VALUES (?, ?, ?, ?, ?)`,
    [title, director, year, rating, thumbnail],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Movie created', id: this.lastID });
    }
  );
});

/* UPDATE movie */
app.put('/movies', (req, res) => {
  const { id, title, director, year, rating, thumbnail } = req.body;

  db.run(
    `UPDATE movies
     SET title = ?, director = ?, year = ?, rating = ?, thumbnail = ?
     WHERE id = ?`,
    [title, director, year, rating, thumbnail, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Movie updated' });
    }
  );
});

/* DELETE movie */
app.delete('/movies/:id', (req, res) => {
  db.run(
    'DELETE FROM movies WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Movie deleted' });
    }
  );
});

/* ---------- Start server ---------- */

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
