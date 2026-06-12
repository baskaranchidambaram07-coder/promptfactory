const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  searchPrompts, getTopCategories, getPrompts, getTopPrompts, getTrending,
  getOnePerCategory, getPromptById, recordClick, generate, debugPromptTable,
} = require('../controllers/promptController');

// All named routes MUST come before /:id
router.get('/search',      searchPrompts);
router.get('/categories',  getTopCategories);
router.get('/top',         getTopPrompts);
router.get('/trending',    getTrending);
router.get('/by-category', getOnePerCategory);
router.get('/',            getPrompts);
router.get('/:id',         getPromptById);
router.post('/:id/click',  recordClick);

// Authenticated
router.post('/generate', authenticate, upload.single('image'), generate);
router.get('/debug/table', debugPromptTable);

module.exports = router;
