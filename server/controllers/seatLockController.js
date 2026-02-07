const seatLockService = require('../services/seatLockService');

/**
 * @desc    Request seat lock
 * @route   POST /api/seat-locks/request
 * @access  Private
 */
exports.requestSeatLock = async (req, res) => {
  try {
    const { eventId, seats } = req.body;
    const userId = req.user.id;

    if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId and seats array'
      });
    }

    // Validate seat format
    for (const seat of seats) {
      if (!seat.sectionId || !seat.rowId || !seat.seatId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid seat format. Each seat must have sectionId, rowId, and seatId'
        });
      }
    }

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');

    const result = await seatLockService.requestSeatLock(
      userId,
      eventId,
      seats,
      io,
      connectedUsers
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error requesting seat lock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to request seat lock'
    });
  }
};

/**
 * @desc    Release seat lock
 * @route   DELETE /api/seat-locks/:eventId
 * @access  Private
 */
exports.releaseSeatLock = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId'
      });
    }

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');

    const result = await seatLockService.releaseSeatsLock(
      userId,
      eventId,
      io,
      connectedUsers
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error releasing seat lock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to release seat lock'
    });
  }
};

/**
 * @desc    Get lock status for user
 * @route   GET /api/seat-locks/:eventId/status
 * @access  Private
 */
exports.getLockStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId'
      });
    }

    const result = await seatLockService.getLockStatus(userId, eventId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting lock status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get lock status'
    });
  }
};
