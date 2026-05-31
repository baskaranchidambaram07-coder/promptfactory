require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/prompt', require('./routes/prompt'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/requests', require('./routes/requests'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', db: 'disconnected' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Start server (skip DB sync for now due to network firewall)
console.log('⚠️  Starting server WITHOUT database connection');
console.log('⚠️  Database is blocked by network firewall on ports 5432/6543');
console.log('⚠️  Server will run but API calls requiring DB will fail');
console.log('⚠️  Frontend UI can still be tested\n');

app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
