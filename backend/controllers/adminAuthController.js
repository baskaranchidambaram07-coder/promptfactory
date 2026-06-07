const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

/* POST /api/admin/auth/login */
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, name, email, password, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !admin)
      return res.status(401).json({ error: 'Invalid email or password' });

    if (!admin.is_active)
      return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password' });

    // Record last login timestamp
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, type: 'admin_portal' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET /api/admin/auth/me  — returns the currently logged-in admin */
const me = async (req, res) => {
  res.json(req.adminUser);
};

module.exports = { login, me };
