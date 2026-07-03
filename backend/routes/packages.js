const express = require('express');
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.get('/slogans', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM slogans WHERE is_active=1 ORDER BY sort_order');
  res.json(rows);
});
router.post('/slogans', verifyToken, requireAdmin, async (req, res) => {
  const [r] = await db.query('INSERT INTO slogans (text,sort_order) VALUES (?,?)', [req.body.text, req.body.sort_order||0]);
  res.json({ id: r.insertId });
});
router.delete('/slogans/:id', verifyToken, requireAdmin, async (req, res) => {
  await db.query('DELETE FROM slogans WHERE id=?', [req.params.id]); res.json({ ok: true });
});
router.get('/packages', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM packages WHERE is_active=1 ORDER BY price');
  res.json(rows);
});
router.post('/packages', verifyToken, requireAdmin, async (req, res) => {
  const { name, description, badge, price, interior_addon } = req.body;
  const [r] = await db.query('INSERT INTO packages (name,description,badge,price,interior_addon) VALUES (?,?,?,?,?)',
    [name, description, badge, price, interior_addon||300]);
  res.json({ id: r.insertId });
});
router.delete('/packages/:id', verifyToken, requireAdmin, async (req, res) => {
  await db.query('UPDATE packages SET is_active=0 WHERE id=?', [req.params.id]); res.json({ ok: true });
});
module.exports = router;
