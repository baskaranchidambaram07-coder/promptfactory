const bcrypt = require('bcryptjs');
const supabase = require('../supabase');

const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id,name,email,role,avatar,is_premium,daily_generations_used,created_at')
      .eq('id', req.user.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (password) updates.password = await bcrypt.hash(password, 12);
    const { data, error } = await supabase.from('users').update(updates).eq('id', req.user.id)
      .select('id,name,email,role,avatar,is_premium').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserRequests = async (req, res) => {
  try {
    const { data, error } = await supabase.from('requests').select('*')
      .eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProfile, updateProfile, getUserRequests };
