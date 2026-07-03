const express = require('express');
const passport = require('passport');
const Google = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();
const router = express.Router();
passport.use(new Google({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (at, rt, profile, done) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE google_id=?', [profile.id]);
    let user;
    if (rows.length) {
      await db.query('UPDATE users SET name=?,picture=? WHERE google_id=?', [profile.displayName, profile.photos[0]?.value, profile.id]);
      user = rows[0];
    } else {
      const [r] = await db.query('INSERT INTO users (google_id,email,name,picture) VALUES (?,?,?,?)',
        [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0]?.value]);
      const [u] = await db.query('SELECT * FROM users WHERE id=?', [r.insertId]);
      user = u[0];
    }
    done(null, user);
  } catch(e) { done(e, null); }
}));
passport.serializeUser((u, done) => done(null, u.id));
passport.deserializeUser(async (id, done) => {
  const [r] = await db.query('SELECT * FROM users WHERE id=?', [id]);
  done(null, r[0]);
});
router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/?error=auth' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role, picture: req.user.picture },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.cookie('token', token, { httpOnly:true, secure:true, maxAge:604800000, sameSite:'none' });
    res.redirect(process.env.FRONTEND_URL + '/');
  }
);
router.get('/me', (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json({ user: null });
  try { res.json({ user: jwt.verify(token, process.env.JWT_SECRET) }); }
  catch { res.json({ user: null }); }
});
router.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
module.exports = router;
