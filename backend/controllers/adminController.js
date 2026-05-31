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
    const [totalUsers, totalRequests, completedRequests, pendingRequests] = await Promise.all([
      User.count(),
      Request.count(),
      Request.count({ where: { status: 'completed' } }),
      Request.count({ where: { status: 'pending' } }),
    ]);
    res.json({ totalUsers, totalRequests, completedRequests, pendingRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Prompt management
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
    const { title, text, category } = req.body;
    const prompt = await Prompt.create({ title, text, category, created_by: req.user.id });
    res.status(201).json(prompt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Prompt.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'Prompt not found' });
    res.json(await Prompt.findByPk(id));
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

module.exports = { getAllUsers, getAllRequests, getStats, getPrompts, createPrompt, updatePrompt, deletePrompt, deleteUser };
