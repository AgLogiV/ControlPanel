const express = require('express');
const {
  getScripts,
  getScriptById,
  createScript,
  updateScript,
  deleteScript,
  runScript,
} = require('../controllers/scriptController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);

// Script routes
router.route('/')
  .get(getScripts)
  .post(createScript);

router.route('/:id')
  .get(getScriptById)
  .put(updateScript)
  .delete(deleteScript);

// Script actions
router.post('/:id/run', runScript);

module.exports = router; 