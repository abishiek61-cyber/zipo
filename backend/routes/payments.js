const express = require('express');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();
router.post('/create-order', verifyToken, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM bookings WHERE id=? AND user_id=?', [req.body.booking_id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
  res.json({ order_id: 'ZIPO_' + req.body.booking_id + '_' + Date.now(), message: 'Add Cashfree keys to .env to enable payments' });
});
module.exports = router;
