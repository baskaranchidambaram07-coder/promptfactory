const bcrypt = require('bcryptjs');
const { User, Request } = require('../models');

const getProfile = async (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (password) updates.password = await bcrypt.hash(password, 12);

    await User.update(updates, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProfile, updateProfile, getUserRequests };
