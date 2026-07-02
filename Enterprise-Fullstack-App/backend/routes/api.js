const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controller imports
const authController = require('../controllers/authController');
const reportController = require('../controllers/reportController');
const commentController = require('../controllers/commentController');
const analyticsController = require('../controllers/analyticsController');

// Middleware imports
const authMiddleware = require('../middleware/auth');

// Multer memory storage config
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication Routes
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.googleLogin);
router.get('/auth/profile', authMiddleware, authController.getProfile);

// Report & AI Diagnostics Routes
router.post('/reports/upload', authMiddleware, upload.single('file'), reportController.uploadReport);
router.post('/reports/analyze', authMiddleware, reportController.analyzeReport);
router.get('/reports', authMiddleware, reportController.getReports);
router.get('/reports/:id', authMiddleware, reportController.getReportById);
router.post('/reports/:reportId/override', authMiddleware, reportController.overrideConsensus);

// Collaboration & Comments Routes
router.get('/reports/:reportId/comments', authMiddleware, commentController.getComments);
router.post('/reports/:reportId/comments', authMiddleware, commentController.createComment);

// Analytics Routes
router.get('/analytics/dashboard', authMiddleware, analyticsController.getDashboardStats);

module.exports = router;
