require('dotenv').config();
// Must be set before any HTTPS calls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/prompt', require('./routes/prompt'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/requests', require('./routes/requests'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const supabase = require('./supabase');

const start = async () => {
  try {
    const { error } = await supabase.from('PromptCollection').select('PromptId').limit(1);
    if (error) throw error;
    console.log('✓ Supabase connected — PromptCollection OK');
    app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('✗ Supabase connection failed:', err.message);
    console.log('\n→ Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env\n');
    process.exit(1);
  }
};

start();
