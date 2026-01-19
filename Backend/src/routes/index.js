const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const courtRoutes = require('./court.routes');
const bookingRoutes = require('./booking.routes');
const calendarRoutes = require('./calendar.routes');
const recurringBookingRoutes = require('./recurringBooking.routes');
const dashboardRoutes = require('./dashboard.routes');

router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courts', courtRoutes);
router.use('/admin/bookings', bookingRoutes);
router.use('/calendar', calendarRoutes);
router.use('/recurring-bookings', recurringBookingRoutes);
router.use('/admin/dashboard', dashboardRoutes);

module.exports = router;
