const express = require('express');
const router = express.Router();
const {
    createCourt,
    getAllCourts,
    getCourtById,
    updateCourt,
    updateCourtStatus,
    deleteCourt,
} = require('../controllers/court.controller');
const { protect } = require('../middlewares/auth.middleware');
const { allowRoles } = require('../middlewares/role.middleware');

// All routes are protected and restricted to ADMIN
router.use(protect);
router.use(allowRoles('ADMIN'));

router.post('/', createCourt);
router.get('/', getAllCourts);
router.get('/:id', getCourtById);
router.put('/:id', updateCourt);
router.patch('/:id/status', updateCourtStatus);
router.delete('/:id', deleteCourt);

module.exports = router;
