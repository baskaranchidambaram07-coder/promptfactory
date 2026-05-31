const { User, Request, Prompt } = require('../models');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalUsers, premiumUsers, totalPrompts, totalRequests, completedRequests] = await Promise.all([
      User.count(),
      User.count({ where: { is_premium: true } }),
      Prompt.count({ where: { is_active: true } }),
      Request.count(),
      Request.count({ where: { status: 'completed' } }),
    ]);
    res.json({ totalUsers, premiumUsers, totalPrompts, totalRequests, completedRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.findAll({ order: [['created_at', 'DESC']] });
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPrompt = async (req, res) => {
  try {
    const { title, text, negative_prompt, category, tags, thumbnail_url, images } = req.body;
    const prompt = await Prompt.create({
      title, text, negative_prompt, category,
      tags: tags || [],
      thumbnail_url: thumbnail_url || null,
      images: images || [],
      created_by: req.user.id,
    });
    res.status(201).json(prompt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePrompt = async (req, res) => {
  try {
    const [updated] = await Prompt.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Prompt not found' });
    res.json(await Prompt.findByPk(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePrompt = async (req, res) => {
  try {
    const deleted = await Prompt.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Prompt not found' });
    res.json({ message: 'Prompt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const togglePremium = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ is_premium: !user.is_premium });
    res.json({ id: user.id, is_premium: !user.is_premium });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers, getAllRequests, getStats,
  getPrompts, createPrompt, updatePrompt, deletePrompt,
  deleteUser, togglePremium,
};
