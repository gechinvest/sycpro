const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { protect } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/admin-register', authController.adminRegister);
router.post('/login', authController.login);
router.get('/referrer/:code', authController.getReferrerByCode);
router.get('/profile', protect, authController.getProfile);
router.put('/update-password', protect, authController.updatePassword);
router.put('/update-withdraw-password', protect, authController.updateWithdrawPassword);

module.exports = router;
