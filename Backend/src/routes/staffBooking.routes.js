const express = require('express');
const router = express.Router();
const { createStaffBooking } = require('../controllers/staffBooking.controller');
const { protect } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// All staff booking routes are protected and restricted to STAFF and ADMIN
router.use(protect);
router.use(allowRoles('STAFF', 'ADMIN'));

router.post('/', createStaffBooking);

module.exports = router;
