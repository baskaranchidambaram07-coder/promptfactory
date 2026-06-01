const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  getTopCategories, getPrompts, getTopPrompts, getTrending,
  getOnePerCategory, getPromptById, recordClick, generate,
} = require('../controllers/promptController');

// Public routes
router.get('/categories', getTopCategories);
router.get('/top', getTopPrompts);
router.get('/trending', getTrending);
router.get('/by-category', getOnePerCategory);
router.get('/', getPrompts);
router.get('/:id', getPromptById);
router.post('/:id/click', recordClick);

// Authenticated
router.post('/generate', authenticate, upload.single('image'), generate);

module.exports = router;
