const router = require('express').Router();
const { login, me } = require('../controllers/adminAuthController');
const { requireAdminAuth } = require('../middlewares/adminAuth');

router.post('/login', login);
router.get('/me', requireAdminAuth, me);

module.exports = router;
