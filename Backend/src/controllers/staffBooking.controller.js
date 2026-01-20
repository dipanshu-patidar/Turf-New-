const mongoose = require('mongoose');
const moment = require('moment');
const Booking = require('../models/Booking.model');
const BookingSlot = require('../models/BookingSlot.model');
const Court = require('../models/Court.model');
const Payment = require('../models/Payment.model');
const Settings = require('../models/Settings.model');
const { generateSlots } = require('../services/slotGenerator.service');
const { calculatePrice } = require('../services/pricing.service');

/**
 * @desc    Create new booking by Staff/Admin
 * @route   POST /api/staff/bookings
 * @access  Private (Staff/Admin)
 */
const createStaffBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            customerName,
            phoneNumber,
            bookingDate,
            startTime,
            endTime,
            courtId,
            sport,
            advancePaid,
            remainingBalance,
            paymentMode
        } = req.body;

        // 1. Basic Validation
        if (!customerName || !phoneNumber || !bookingDate || !startTime || !endTime || !courtId || !sport) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // 2. Phone Validation (10-digit)
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ message: 'Please provide a valid 10-digit phone number' });
        }

        // 3. Fetch Settings for Operating Hours
        const settings = await Settings.getSettings();
        const start = moment(startTime, 'HH:mm');
        const end = moment(endTime, 'HH:mm');
        const open = moment(settings.openingTime, 'HH:mm');
        const close = moment(settings.closingTime, 'HH:mm');

        if (start.isBefore(open) || end.isAfter(close)) {
            return res.status(400).json({
                message: `Booking must be within operating hours (${settings.openingTime} - ${settings.closingTime})`
            });
        }

        // 4. Fetch Court details
        const court = await Court.findById(courtId).session(session);
        if (!court) {
            throw new Error('Court not found');
        }
        if (court.status !== 'ACTIVE') {
            throw new Error('Court is not active');
        }

        // Optional: Check if sport matches court (if court has specific sports)
        if (court.sportType && court.sportType.toLowerCase() !== sport.toLowerCase()) {
            throw new Error(`This court is for ${court.sportType}, not ${sport}`);
        }

        // 5. Generate Slots and Check for Gaps
        // slotGenerator.service.js ensures 15-min slots and throws if end <= start
        const slots = generateSlots(startTime, endTime);

        // 6. Check for Double Booking
        const bDate = new Date(bookingDate);
        bDate.setHours(0, 0, 0, 0);

        const existingSlots = await BookingSlot.find({
            courtId,
            bookingDate: bDate,
            slotTime: { $in: slots }
        }).populate('bookingId').session(session);

        const activeConflicts = existingSlots.filter(s => s.bookingId && s.bookingId.status === 'BOOKED');
        if (activeConflicts.length > 0) {
            const takenTimes = [...new Set(activeConflicts.map(s => s.slotTime))].join(', ');
            return res.status(409).json({ message: `Slots already booked: ${takenTimes}` });
        }

        // Clean up zombie slots if any
        if (existingSlots.length > 0) {
            await BookingSlot.deleteMany({ _id: { $in: existingSlots.map(s => s._id) } }).session(session);
        }

        // 7. Calculate Pricing (System Controlled)
        // calculatePrice uses weekday/weekend rates from court
        const baseAmount = calculatePrice(court, slots.length, bDate);
        const totalAmount = Math.ceil(baseAmount); // No discounts for staff

        // 8. Verify Payment Balance
        // Backend recalculates remainingBalance
        const calculatedRemaining = Math.max(0, totalAmount - (advancePaid || 0));

        if (Number(remainingBalance) !== calculatedRemaining) {
            return res.status(400).json({
                message: 'Payment mismatch. Remaining balance must equal Total - Advance Paid.',
                calculatedTotal: totalAmount,
                calculatedBalance: calculatedRemaining
            });
        }

        if (advancePaid > totalAmount) {
            return res.status(400).json({ message: 'Advance paid cannot exceed total amount' });
        }

        // 9. Duration in Hours for record keeping (not strictly required by model but good for logic)
        const durationHours = slots.length * 0.25;

        // 10. Create Records
        const booking = await Booking.create([{
            customerName,
            customerPhone: phoneNumber,
            sportType: sport,
            courtId,
            bookingDate: bDate,
            startTime,
            endTime,
            totalSlots: slots.length,
            baseAmount: totalAmount,
            discountType: 'NONE',
            discountValue: 0,
            finalAmount: totalAmount,
            createdBy: req.user._id,
            status: 'BOOKED'
        }], { session });

        const bookingSlotDocs = slots.map(time => ({
            bookingId: booking[0]._id,
            courtId,
            bookingDate: bDate,
            slotTime: time
        }));

        await BookingSlot.insertMany(bookingSlotDocs, { session });

        await Payment.create([{
            bookingId: booking[0]._id,
            totalAmount,
            advancePaid: advancePaid || 0,
            balanceAmount: calculatedRemaining,
            paymentMode: paymentMode || 'CASH',
            status: calculatedRemaining === 0 ? 'PAID' : (advancePaid > 0 ? 'PARTIAL' : 'PENDING')
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: booking[0]
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Staff Booking Error:', error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

module.exports = {
    createStaffBooking
};
