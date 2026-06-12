const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/achievements', (req, res) => {
  db.all('SELECT * FROM achievements ORDER BY created_at DESC', [], (err, rows) => res.json(rows || []));
});

router.get('/skills', (req, res) => {
  db.all('SELECT * FROM skills ORDER BY category, name', [], (err, rows) => res.json(rows || []));
});

module.exports = router;
