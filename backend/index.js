require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const session    = require('express-session');
const passport   = require('passport');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => { console.log(req.method, req.path); next(); });

try { app.use('/auth',         require('./routes/auth'));     console.log('✓ auth'); } catch(e) { console.error('✗ auth:', e.message); }
try { app.use('/api',          require('./routes/packages')); console.log('✓ packages'); } catch(e) { console.error('✗ packages:', e.message); }
try { app.use('/api/bookings', require('./routes/bookings')); console.log('✓ bookings'); } catch(e) { console.error('✗ bookings:', e.message); }
try { app.use('/api/payments', require('./routes/payments')); console.log('✓ payments'); } catch(e) { console.error('✗ payments:', e.message); }
try { app.use('/api/admin',    require('./routes/admin'));    console.log('✓ admin'); } catch(e) { console.error('✗ admin:', e.message); }
try { app.use('/api/features', require('./routes/features')); console.log('✓ features'); } catch(e) { console.error('✗ features:', e.message); }

app.use((err, req, res, next) => { console.error('ERROR:', err.message); res.status(500).json({ error: err.message }); });
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n  ✓ Zipo API → http://localhost:' + PORT + '\n');
  try { require('./services/reminders').startReminderCron(); } catch(e) { console.error('Cron failed:', e.message); }
});
