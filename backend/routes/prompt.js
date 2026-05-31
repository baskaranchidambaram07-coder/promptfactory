const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { generate } = require('../controllers/promptController');
const { Prompt } = require('../models');

router.use(authenticate);

// Get all active prompts
router.get('/', async (req, res) => {
  try {
    const prompts = await Prompt.findAll({ where: { is_active: true } });
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate: upload image + apply prompt
router.post('/generate', upload.single('image'), generate);

module.exports = router;
