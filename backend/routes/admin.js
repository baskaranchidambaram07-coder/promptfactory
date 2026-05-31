const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  getAllUsers, getAllRequests, getStats,
  getPrompts, createPrompt, updatePrompt, deletePrompt, deleteUser
} = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/requests', getAllRequests);
router.get('/prompts', getPrompts);
router.post('/prompts', createPrompt);
router.put('/prompts/:id', updatePrompt);
router.delete('/prompts/:id', deletePrompt);

module.exports = router;
