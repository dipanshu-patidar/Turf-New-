const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
