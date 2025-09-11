const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { connectMongo } = require('./lib/db');
const { ensureDefaultAdmin } = require('./lib/seed');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true,
}));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

// Serve client build (Render: combined deploy)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = Number(process.env.PORT) || 10000;
connectMongo().then(async () => {
  await ensureDefaultAdmin();
  const server = app
    .listen(PORT, '0.0.0.0', () => console.log(`Server running on :${PORT}`))
    .on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Set a different PORT in your environment or stop the other process.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
}).catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});


