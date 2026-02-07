const express = require('express');
const router = express.Router();
const {
  requestSeatLock,
  releaseSeatLock,
  getLockStatus
} = require('../controllers/seatLockController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, requestSeatLock);
router.delete('/:eventId', protect, releaseSeatLock);
router.get('/:eventId/status', protect, getLockStatus);

module.exports = router;
