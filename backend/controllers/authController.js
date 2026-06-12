const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (u) => ({
  id: u.id, name: u.name, email: u.email,
  role: u.role, avatar: u.avatar, is_premium: u.is_premium,
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from('users').insert({ name, email, password: hashed }).select().single();
    if (error) throw error;

    res.status(201).json({ token: generateToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ token: generateToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { google_id, email, name, avatar } = req.body;
    if (!google_id || !email) return res.status(400).json({ error: 'google_id and email required' });

    let { data: user } = await supabase.from('users').select('*').eq('google_id', google_id).single();
    if (!user) {
      let { data: byEmail } = await supabase.from('users').select('*').eq('email', email).single();
      if (byEmail) {
        const { data: updated } = await supabase
          .from('users').update({ google_id, avatar: avatar || byEmail.avatar })
          .eq('id', byEmail.id).select().single();
        user = updated;
      } else {
        const { data: created, error } = await supabase
          .from('users').insert({ name, email, google_id, avatar }).select().single();
        if (error) throw error;
        user = created;
      }
    }
    res.json({ token: generateToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, googleAuth };
