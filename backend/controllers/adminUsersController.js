const bcrypt = require('bcryptjs');
const supabase = require('../supabase');

/* GET /api/admin/admin-users */
const getAdminUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, is_active, last_login, created_at, created_by')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* POST /api/admin/admin-users */
const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' });
    if (!['admin', 'manager'].includes(role))
      return res.status(400).json({ error: 'role must be admin or manager' });

    const hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from('admin_users')
      .insert({ name, email: email.toLowerCase().trim(), password: hash, role, created_by: req.adminUser.id })
      .select('id, name, email, role, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email already exists' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PUT /api/admin/admin-users/:id */
const updateAdminUser = async (req, res) => {
  try {
    const { name, email, role, is_active, password } = req.body;

    // Prevent demoting/deactivating yourself
    if (req.params.id === req.adminUser.id) {
      if (is_active === false) return res.status(400).json({ error: 'You cannot deactivate your own account' });
      if (role && role !== req.adminUser.role) return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (name  !== undefined) updates.name      = name;
    if (email !== undefined) updates.email     = email.toLowerCase().trim();
    if (role  !== undefined) updates.role      = role;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password) updates.password = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role, is_active, last_login, created_at')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Admin user not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE /api/admin/admin-users/:id */
const deleteAdminUser = async (req, res) => {
  try {
    if (req.params.id === req.adminUser.id)
      return res.status(400).json({ error: 'You cannot delete your own account' });

    const { error } = await supabase.from('admin_users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Admin user deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* PATCH /api/admin/admin-users/:id/toggle  — toggle is_active */
const toggleAdminUser = async (req, res) => {
  try {
    if (req.params.id === req.adminUser.id)
      return res.status(400).json({ error: 'You cannot deactivate your own account' });

    const { data: current } = await supabase
      .from('admin_users').select('is_active').eq('id', req.params.id).single();
    if (!current) return res.status(404).json({ error: 'Not found' });

    const { data, error } = await supabase
      .from('admin_users')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, name, email, role, is_active')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, toggleAdminUser };
