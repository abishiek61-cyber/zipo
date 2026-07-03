const express = require('express');
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  const [[today]] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM bookings WHERE DATE(created_at)=CURDATE() AND payment_status='paid'");
  const [[pending]] = await db.query("SELECT COUNT(*) as count FROM bookings WHERE status='pending'");
  const [[total]] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM bookings WHERE payment_status='paid'");
  res.json({ today, pending: pending.count, total });
});
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  const [rows] = await db.query('SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});
router.put('/users/:id/role', verifyToken, requireAdmin, async (req, res) => {
  await db.query('UPDATE users SET role=? WHERE id=?', [req.body.role, req.params.id]);
  res.json({ ok: true });
});
module.exports = router;
