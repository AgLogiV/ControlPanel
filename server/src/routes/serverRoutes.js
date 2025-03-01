const express = require('express');
const {
  getServers,
  getServerById,
  createServer,
  updateServer,
  deleteServer,
  startServer,
  stopServer,
  restartServer,
} = require('../controllers/serverController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);

// Server routes
router.route('/')
  .get(getServers)
  .post(createServer);

router.route('/:id')
  .get(getServerById)
  .put(updateServer)
  .delete(deleteServer);

// Server actions
router.post('/:id/start', startServer);
router.post('/:id/stop', stopServer);
router.post('/:id/restart', restartServer);

module.exports = router; 