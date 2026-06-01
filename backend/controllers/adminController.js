const supabase = require('../supabase');

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id,name,email,role,avatar,is_premium,daily_generations_used,created_at').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const { data, error } = await supabase.from('requests').select('*, users(id,name,email)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [users, premium, prompts, requests, completed] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('requests').select('*', { count: 'exact', head: true }),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);
    res.json({
      totalUsers: users.count, premiumUsers: premium.count,
      totalPrompts: prompts.count, totalRequests: requests.count,
      completedRequests: completed.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPrompts = async (req, res) => {
  try {
    const { data, error } = await supabase.from('prompts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPrompt = async (req, res) => {
  try {
    const { title, text, negative_prompt, category, tags, thumbnail_url, images } = req.body;
    const { data, error } = await supabase.from('prompts').insert({
      title, text, negative_prompt, category,
      tags: tags || [], thumbnail_url: thumbnail_url || null,
      images: images || [], created_by: req.user.id,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePrompt = async (req, res) => {
  try {
    const { data, error } = await supabase.from('prompts').update(req.body).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ error: 'Prompt not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePrompt = async (req, res) => {
  try {
    const { error } = await supabase.from('prompts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Prompt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const togglePremium = async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('is_premium').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { data, error } = await supabase.from('users').update({ is_premium: !user.is_premium }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ id: data.id, is_premium: data.is_premium });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllUsers, getAllRequests, getStats, getPrompts, createPrompt, updatePrompt, deletePrompt, deleteUser, togglePremium };
