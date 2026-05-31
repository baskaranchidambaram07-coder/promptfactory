const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { Request } = require('../models');

router.use(authenticate);

router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
