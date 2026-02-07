const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBooking,
  cancelBooking,
  updatePaymentStatus
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, createBooking)
  .get(protect, getMyBookings);

router.get('/all', protect, authorize('admin'), getAllBookings);

router.route('/:id')
  .get(protect, getBooking)
  .delete(protect, cancelBooking);

router.put('/:id/payment', protect, updatePaymentStatus);

module.exports = router;