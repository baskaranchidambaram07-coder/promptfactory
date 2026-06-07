const router = require('express').Router();
const { requireAdminAuth, requireRole } = require('../middlewares/adminAuth');
const {
  getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, toggleAdminUser,
} = require('../controllers/adminUsersController');
const {
  getStats,
  getAllUsers, getUserById, updateUser, deleteUser, togglePremium, resetUserUsage,
  getCollection, createCollectionItem, updateCollectionItem, deleteCollectionItem, bulkUpdateUsedCount,
  updatePromptImages,
  getSubscriptions, updateSubscription,
  getAllRequests, getUsageSummary,
  getLLMKeys, upsertLLMKey, deleteLLMKey, toggleLLMKey,
  // legacy
  getPrompts, createPrompt, updatePrompt, deletePrompt,
} = require('../controllers/adminController');

// All admin data routes require a valid admin-portal JWT
router.use(requireAdminAuth);

/* ── Admin Portal User Management (admin role only) ── */
router.get('/admin-users',             requireRole('admin'), getAdminUsers);
router.post('/admin-users',            requireRole('admin'), createAdminUser);
router.put('/admin-users/:id',         requireRole('admin'), updateAdminUser);
router.delete('/admin-users/:id',      requireRole('admin'), deleteAdminUser);
router.patch('/admin-users/:id/toggle',requireRole('admin'), toggleAdminUser);

/* ── Dashboard ── */
router.get('/stats', getStats);

/* ── User Management ── */
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/premium', togglePremium);
router.patch('/users/:id/reset-usage', resetUserUsage);

/* ── Prompt Collection (customer-facing prompts) ── */
router.get('/collection', getCollection);
router.post('/collection', createCollectionItem);
router.put('/collection/:id', updateCollectionItem);
router.delete('/collection/:id', deleteCollectionItem);
router.patch('/collection/usedcount', bulkUpdateUsedCount);

/* ── Image Management ── */
router.patch('/collection/:id/images', updatePromptImages);

/* ── Subscription Management ── */
router.get('/subscriptions', getSubscriptions);
router.patch('/subscriptions/:id', updateSubscription);

/* ── Usage Management ── */
router.get('/requests', getAllRequests);
router.get('/usage', getUsageSummary);

/* ── LLM Key Management ── */
router.get('/llm-keys', getLLMKeys);
router.post('/llm-keys', upsertLLMKey);
router.put('/llm-keys', upsertLLMKey);
router.patch('/llm-keys/:id/toggle', toggleLLMKey);
router.delete('/llm-keys/:id', deleteLLMKey);

/* ── Legacy prompt routes ── */
router.get('/prompts', getPrompts);
router.post('/prompts', createPrompt);
router.put('/prompts/:id', updatePrompt);
router.delete('/prompts/:id', deletePrompt);

module.exports = router;
