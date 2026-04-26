const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public routes
router.get('/settings', investmentController.getSettings);
router.get('/plans', investmentController.getPlans);

// Protected routes
router.use(protect);

router.get('/deposit-methods', investmentController.getDepositMethods);
router.post('/recharge', upload.single('screenshot'), investmentController.rechargeWallet);
router.post('/buy-plan', investmentController.buyPlan);
router.get('/my-investments', investmentController.getMyInvestments);
router.get('/roi-history', investmentController.getRoiHistory);
router.get('/referrals', investmentController.getMyReferrals);
router.get('/transactions', investmentController.getTransactions);
router.get('/dashboard-stats', investmentController.getDashboardStats);

// Bank Accounts
router.get('/bank-accounts', investmentController.getBankAccounts);
router.post('/bank-accounts', investmentController.addBankAccount);
router.delete('/bank-accounts/:id', investmentController.deleteBankAccount);

// Withdrawals
router.post('/withdraw', investmentController.requestWithdrawal);
router.get('/withdrawals', investmentController.getWithdrawalHistory);

module.exports = router;
