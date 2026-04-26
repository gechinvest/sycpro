const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(protect, adminOnly);

router.get('/recharges', adminController.getRecharges);
router.post('/recharges/:id/review', adminController.reviewRecharge);
router.get('/withdrawals', adminController.getWithdrawals);
router.post('/withdrawals/:id/review', adminController.reviewWithdrawal);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id/activity', adminController.getUserActivity);
router.put('/users/:id/toggle-admin', adminController.toggleAdminStatus);

// Plan Management
router.get('/plans', adminController.getAllPlans);
router.post('/plans', upload.single('image'), adminController.createPlan);
router.put('/plans/:id', upload.single('image'), adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

// System Settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);
router.post('/deposit-methods', adminController.addDepositMethod);
router.put('/deposit-methods/:id', adminController.updateDepositMethod);
router.delete('/deposit-methods/:id', adminController.deleteDepositMethod);

// User Management Extensions
router.put('/bank-accounts/:id', adminController.updateUserBank);
router.get('/stats', adminController.getAdminStats);
router.get('/health-check', adminController.checkSystemStatus);
router.post('/run-migrations', adminController.runAutoMigration);

// Active Investment Management
router.put('/investments/:id', adminController.updateActiveInvestment);

module.exports = router;
