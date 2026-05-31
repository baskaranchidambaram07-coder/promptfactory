const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { registerWebhook, getWebhooks, sendToWebhook, receiveWebhook } = require('../controllers/webhookController');

// Public receive endpoint
router.post('/receive', receiveWebhook);

router.use(authenticate);
router.get('/', getWebhooks);
router.post('/register', registerWebhook);
router.post('/send', sendToWebhook);

module.exports = router;
