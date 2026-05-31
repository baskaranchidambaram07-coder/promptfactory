const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  is_premium: user.is_premium,
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ token: generateToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ token: generateToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Google OAuth — called after frontend verifies Google token and sends profile
const googleAuth = async (req, res) => {
  try {
    const { google_id, email, name, avatar } = req.body;
    if (!google_id || !email) return res.status(400).json({ error: 'google_id and email required' });

    let user = await User.findOne({ where: { google_id } });
    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        await user.update({ google_id, avatar: avatar || user.avatar });
      } else {
        user = await User.create({ name, email, google_id, avatar, password: null });
      }
    }

    res.json({ token: generateToken(user), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, googleAuth };
