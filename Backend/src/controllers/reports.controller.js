const mongoose = require('mongoose');
const Booking = require('../models/Booking.model');
const Payment = require('../models/Payment.model');
const Court = require('../models/Court.model');

/**
 * GET /api/admin/reports/daily
 * Query: date (YYYY-MM-DD), courtId (optional)
 */
const getDailyReport = async (req, res) => {
    try {
        const { date, courtId } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

        const match = {
            bookingDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'CANCELLED' }
        };

        if (courtId) {
            match.courtId = new mongoose.Types.ObjectId(courtId);
        }

        const reportData = await Booking.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'bookingId',
                    as: 'paymentInfo'
                }
            },
            { $unwind: '$paymentInfo' },
            {
                $lookup: {
                    from: 'courts',
                    localField: 'courtId',
                    foreignField: '_id',
                    as: 'courtDetails'
                }
            },
            { $unwind: '$courtDetails' },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: { $subtract: ['$paymentInfo.totalAmount', '$paymentInfo.balanceAmount'] } },
                    pendingBalance: { $sum: '$paymentInfo.balanceAmount' },
                    bookings: {
                        $push: {
                            bookingId: '$_id',
                            customerName: '$customerName',
                            court: '$courtDetails.name',
                            time: { $concat: ['$startTime', ' - ', '$endTime'] },
                            totalAmount: '$paymentInfo.totalAmount',
                            balance: '$paymentInfo.balanceAmount'
                        }
                    }
                }
            }
        ]);

        if (reportData.length === 0) {
            return res.json({
                totalBookings: 0,
                totalRevenue: 0,
                pendingBalance: 0,
                bookings: []
            });
        }

        res.json(reportData[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/admin/reports/monthly
 * Query: month (YYYY-MM)
 */
const getMonthlyReport = async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ message: 'Month (YYYY-MM) is required' });

        const [year, monthVal] = month.split('-').map(Number);
        const startOfMonth = new Date(year, monthVal - 1, 1);
        const endOfMonth = new Date(year, monthVal, 0, 23, 59, 59, 999);

        const monthlyData = await Booking.aggregate([
            {
                $match: {
                    bookingDate: { $gte: startOfMonth, $lte: endOfMonth },
                    status: { $ne: 'CANCELLED' }
                }
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'bookingId',
                    as: 'pay'
                }
            },
            { $unwind: '$pay' },
            {
                $facet: {
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalBookings: { $sum: 1 },
                                totalCollection: { $sum: { $subtract: ['$pay.totalAmount', '$pay.balanceAmount'] } },
                                pendingBalance: { $sum: '$pay.balanceAmount' }
                            }
                        }
                    ],
                    dailyTrend: [
                        {
                            $group: {
                                _id: { $dayOfMonth: '$bookingDate' },
                                bookings: { $sum: 1 },
                                revenue: { $sum: { $subtract: ['$pay.totalAmount', '$pay.balanceAmount'] } }
                            }
                        },
                        { $sort: { '_id': 1 } },
                        {
                            $project: {
                                day: '$_id',
                                bookings: 1,
                                revenue: 1,
                                _id: 0
                            }
                        }
                    ]
                }
            }
        ]);

        const result = {
            summary: monthlyData[0].summary[0] || { totalBookings: 0, totalCollection: 0, pendingBalance: 0 },
            dailyTrend: monthlyData[0].dailyTrend
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/admin/reports/revenue
 * Query: from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
const getRevenueReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) return res.status(400).json({ message: 'From and To dates are required' });

        const startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);

        const report = await Booking.aggregate([
            {
                $match: {
                    bookingDate: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'CANCELLED' }
                }
            },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'bookingId',
                    as: 'pay'
                }
            },
            { $unwind: '$pay' },
            {
                $lookup: {
                    from: 'courts',
                    localField: 'courtId',
                    foreignField: '_id',
                    as: 'court'
                }
            },
            { $unwind: '$court' },
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: { $subtract: ['$pay.totalAmount', '$pay.balanceAmount'] } }
                            }
                        }
                    ],
                    trend: [
                        {
                            $group: {
                                _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
                                amount: { $sum: { $subtract: ['$pay.totalAmount', '$pay.balanceAmount'] } }
                            }
                        },
                        { $sort: { '_id': 1 } },
                        { $project: { date: '$_id', amount: 1, _id: 0 } }
                    ],
                    weekdayVsWeekend: [
                        {
                            $addFields: {
                                dayOfWeek: { $dayOfWeek: '$bookingDate' } // 1 (Sun) to 7 (Sat)
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    $cond: {
                                        if: { $in: ['$dayOfWeek', [1, 7]] },
                                        then: 'weekend',
                                        else: 'weekday'
                                    }
                                },
                                amount: { $sum: { $subtract: ['$pay.totalAmount', '$pay.balanceAmount'] } }
                            }
                        }
                    ],
                    courtWise: [
                        {
                            $group: {
                                _id: '$court.name',
                                amount: { $sum: { $subtract: ['$pay.totalAmount', '$pay.balanceAmount'] } }
                            }
                        },
                        { $project: { court: '$_id', amount: 1, _id: 0 } }
                    ]
                }
            }
        ]);

        const totals = report[0].totals[0] || { totalRevenue: 0 };
        const weekdayVsWeekend = { weekday: 0, weekend: 0 };
        report[0].weekdayVsWeekend.forEach(item => {
            weekdayVsWeekend[item._id] = item.amount;
        });

        res.json({
            totalRevenue: totals.totalRevenue,
            revenueTrend: report[0].trend,
            weekdayVsWeekend,
            courtWise: report[0].courtWise
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/admin/reports/pending
 */
const getPendingBalanceReport = async (req, res) => {
    try {
        const pendingData = await Payment.aggregate([
            { $match: { balanceAmount: { $gt: 0 } } },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'bookingId',
                    foreignField: '_id',
                    as: 'booking'
                }
            },
            { $unwind: '$booking' },
            {
                $match: { 'booking.status': { $ne: 'CANCELLED' } }
            },
            {
                $lookup: {
                    from: 'courts',
                    localField: 'booking.courtId',
                    foreignField: '_id',
                    as: 'court'
                }
            },
            { $unwind: '$court' },
            {
                $group: {
                    _id: null,
                    totalPending: { $sum: '$balanceAmount' },
                    pendingBookings: {
                        $push: {
                            customerName: '$booking.customerName',
                            court: '$court.name',
                            balance: '$balanceAmount',
                            bookingDate: { $dateToString: { format: '%Y-%m-%d', date: '$booking.bookingDate' } }
                        }
                    }
                }
            }
        ]);

        if (pendingData.length === 0) {
            return res.json({ totalPending: 0, pendingBookings: [] });
        }

        res.json(pendingData[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDailyReport,
    getMonthlyReport,
    getRevenueReport,
    getPendingBalanceReport
};
