const express = require('express');
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

const setSetting = async (key, value) => {
  await db.query(
    'INSERT INTO settings (key_name,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?',
    [key, value, value]
  );
};

router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT key_name, value FROM settings');
    const s = {};
    rows.forEach(r => s[r.key_name] = r.value);
    res.json(s);
  } catch(e) { res.json({}); }
});

router.put('/settings', verifyToken, requireAdmin, async (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body)) {
      await setSetting(k, v);
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/slots-config', async (req, res) => {
  try {
    const [r] = await db.query("SELECT value FROM settings WHERE key_name='booking_slots'");
    const slots = r[0]?.value ? JSON.parse(r[0].value) : ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
    res.json({ slots });
  } catch(e) { res.json({ slots: ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'] }); }
});

router.put('/slots-config', verifyToken, requireAdmin, async (req, res) => {
  try {
    await setSetting('booking_slots', JSON.stringify(req.body.slots));
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [[rev7]] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total FROM bookings WHERE created_at >= DATE_SUB(NOW(),INTERVAL 7 DAY)");
    const [[rev30]] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total FROM bookings WHERE created_at >= DATE_SUB(NOW(),INTERVAL 30 DAY)");
    const [[revAll]] = await db.query("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count FROM bookings");
    const [byPackage] = await db.query(`SELECT p.name, COUNT(*) as count, COALESCE(SUM(b.total_amount),0) as revenue FROM bookings b JOIN packages p ON b.package_id=p.id GROUP BY p.id, p.name ORDER BY revenue DESC`);
    const [byPincode] = await db.query(`SELECT COALESCE(NULLIF(pincode,''),'Unknown') as pincode, COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM bookings GROUP BY pincode ORDER BY count DESC LIMIT 10`);
    const [daily] = await db.query(`SELECT DATE(created_at) as date, COUNT(*) as bookings, COALESCE(SUM(total_amount),0) as revenue FROM bookings WHERE created_at >= DATE_SUB(NOW(),INTERVAL 30 DAY) GROUP BY DATE(created_at) ORDER BY date ASC`);
    const [byFreq] = await db.query(`SELECT COALESCE(NULLIF(frequency,''),'once') as frequency, COUNT(*) as count FROM bookings GROUP BY frequency`);
    res.json({ revenue7: rev7.total, revenue30: rev30.total, revenueAll: revAll.total, totalBookings: revAll.count, byPackage, byPincode, daily, byFreq });
  } catch(e) { console.error('analytics error:', e.message); res.status(500).json({ error: e.message }); }
});

router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT r.*,u.name as customer_name,p.name as package_name FROM reviews r JOIN users u ON r.user_id=u.id JOIN bookings b ON r.booking_id=b.id JOIN packages p ON b.package_id=p.id ORDER BY r.created_at DESC LIMIT 20`);
    res.json(rows);
  } catch(e) { res.json([]); }
});

router.post('/reviews', verifyToken, async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5' });
    const [ex] = await db.query('SELECT id FROM reviews WHERE booking_id=? AND user_id=?', [booking_id, req.user.id]);
    if (ex.length) return res.status(400).json({ error: 'Already reviewed' });
    await db.query('INSERT INTO reviews (booking_id,user_id,rating,comment) VALUES (?,?,?,?)', [booking_id, req.user.id, rating, comment]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/loyalty', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM loyalty WHERE user_id=?', [req.user.id]);
    res.json(rows[0] || { points: 0, total_earned: 0 });
  } catch(e) { res.json({ points: 0, total_earned: 0 }); }
});

router.get('/promo/:code', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM promo_codes WHERE code=? AND is_active=1 AND used_count < max_uses AND (valid_until IS NULL OR valid_until >= CURDATE())', [req.params.code.toUpperCase()]);
    if (!rows.length) return res.status(404).json({ error: 'Invalid or expired code' });
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/promo-admin', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(rows);
  } catch(e) { res.json([]); }
});

router.post('/promo', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { code, discount_type, discount_value, max_uses, valid_until } = req.body;
    if (!code || !discount_value) return res.status(400).json({ error: 'Code and value required' });
    await db.query('INSERT INTO promo_codes (code,discount_type,discount_value,max_uses,valid_until) VALUES (?,?,?,?,?)',
      [code.toUpperCase(), discount_type||'percent', discount_value, max_uses||100, valid_until||null]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/promo/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE promo_codes SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/staff', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff WHERE is_active=1 ORDER BY name');
    res.json(rows);
  } catch(e) { res.json([]); }
});

router.post('/staff', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const [r] = await db.query('INSERT INTO staff (name,phone) VALUES (?,?)', [name, phone||'']);
    res.json({ id: r.insertId, name, phone });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/staff/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE staff SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/bookings/:id/assign', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE bookings SET staff_id=? WHERE id=?', [req.body.staff_id, req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/gallery', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gallery WHERE is_active=1 ORDER BY created_at DESC');
    res.json(rows);
  } catch(e) { res.json([]); }
});

router.post('/gallery', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { image_url, caption, source } = req.body;
    if (!image_url) return res.status(400).json({ error: 'Image URL required' });
    await db.query('INSERT INTO gallery (before_url,after_url,caption) VALUES (?,?,?)',
      [image_url, image_url, caption||'']);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/gallery/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE gallery SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/blog', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM blog_posts WHERE is_active=1 ORDER BY created_at DESC');
    res.json(rows);
  } catch(e) { res.json([]); }
});

router.post('/blog', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, image_url } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const [r] = await db.query('INSERT INTO blog_posts (title,content,image_url) VALUES (?,?,?)',
      [title, content, image_url||null]);
    res.json({ id: r.insertId, ok: true });
  } catch(e) { console.error('blog post:', e.message); res.status(500).json({ error: e.message }); }
});

router.delete('/blog/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE blog_posts SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/service-areas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM service_areas WHERE is_active=1 ORDER BY area_name');
    res.json(rows);
  } catch(e) { res.json([]); }
});

router.post('/service-areas', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { pincode, area_name } = req.body;
    if (!pincode || !area_name) return res.status(400).json({ error: 'Pincode and name required' });
    await db.query('INSERT INTO service_areas (pincode,area_name,is_active) VALUES (?,?,1) ON DUPLICATE KEY UPDATE area_name=?,is_active=1',
      [pincode, area_name, area_name]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/service-areas/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE service_areas SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/referral-code', verifyToken, async (req, res) => {
  try {
    const code = 'ZIPO' + req.user.id.toString().padStart(4,'0');
    res.json({ code, link: (process.env.FRONTEND_URL||'http://localhost:5174') + '/?ref=' + code });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

router.post('/generate-referral', verifyToken, async (req, res) => {
  try {
    const code = 'ZIPO' + req.user.id.toString().padStart(4,'0');
    await db.query('UPDATE users SET referral_code=? WHERE id=? AND referral_code IS NULL', [code, req.user.id]);
    res.json({ code, link: (process.env.FRONTEND_URL||'http://localhost:5174') + '/?ref=' + code });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
