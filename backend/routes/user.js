const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { getProfile, updateProfile, getUserRequests } = require('../controllers/userController');

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/requests', getUserRequests);

module.exports = router;
