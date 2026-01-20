const express = require('express');
const router = express.Router();
const {
    getStaffDayCalendar,
    updateStaffCalendarBooking,
    cancelStaffCalendarBooking
} = require('../controllers/staffCalendar.controller');
const { protect } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// All staff calendar routes are protected and limited to STAFF and ADMIN
router.use(protect);
router.use(allowRoles('STAFF', 'ADMIN'));

/**
 * @route   GET /api/staff/calendar/day
 * @desc    Get day view for staff calendar
 */
router.get('/day', getStaffDayCalendar);

/**
 * @route   PUT /api/staff/calendar/bookings/:id
 * @desc    Edit booking from calendar (restricted)
 */
router.put('/bookings/:id', updateStaffCalendarBooking);

/**
 * @route   PATCH /api/staff/calendar/bookings/:id/cancel
 * @desc    Cancel booking from calendar
 */
router.patch('/bookings/:id/cancel', cancelStaffCalendarBooking);

module.exports = router;
