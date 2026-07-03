const express = require('express');
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../services/email');
const router = express.Router();

router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });
    const [slotConfig] = await db.query("SELECT value FROM settings WHERE key_name='booking_slots'");
    const takenSlots = await db.query(
      "SELECT TIME_FORMAT(slot_datetime,'%H:%i') as slot_time FROM bookings WHERE DATE(slot_datetime)=? AND status!='cancelled'",
      [date]);
    res.json(takenSlots[0].map(r => r.slot_time));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { package_id, slot_datetime, include_interior, car_registration, address, phone, pincode, frequency, promo_code, discount_amount } = req.body;
    const [pkgs] = await db.query('SELECT * FROM packages WHERE id=?', [package_id]);
    if (!pkgs.length) return res.status(404).json({ error: 'Package not found' });
    const pkg = pkgs[0];
    let total = parseFloat(pkg.price) + (include_interior ? parseFloat(pkg.interior_addon) : 0);
    if (discount_amount) total = Math.max(0, total - parseFloat(discount_amount));
    const [r] = await db.query(
      'INSERT INTO bookings (user_id,package_id,slot_datetime,include_interior,total_amount,car_registration,address,phone,pincode,frequency,promo_code,discount_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [req.user.id, package_id, slot_datetime, include_interior, total, car_registration, address, phone, pincode, frequency||'once', promo_code||null, discount_amount||0]
    );
    const [users] = await db.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (users[0]?.email) {
      sendBookingConfirmation({
        to: users[0].email,
        name: users[0].name,
        package_name: pkg.name,
        slot: new Date(slot_datetime).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }),
        address: address + (pincode ? ', ' + pincode : ''),
        total: total.toLocaleString('en-IN'),
        car: car_registration
      }).catch(()=>{});
    }
    res.json({ id: r.insertId, total, status: 'pending' });
  } catch(e) { console.error('booking:', e.message); res.status(500).json({ error: e.message }); }
});

router.get('/mine', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT b.*,p.name as package_name,p.badge FROM bookings b JOIN packages p ON b.package_id=p.id WHERE b.user_id=? ORDER BY b.created_at DESC',
      [req.user.id]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT b.*,u.name as customer_name,u.email,p.name as package_name FROM bookings b JOIN users u ON b.user_id=u.id JOIN packages p ON b.package_id=p.id ORDER BY b.slot_datetime DESC LIMIT 100');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE bookings SET status=? WHERE id=?', [req.body.status, req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
