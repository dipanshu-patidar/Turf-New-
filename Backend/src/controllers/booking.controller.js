const Booking = require('../models/Booking.model');
const BookingSlot = require('../models/BookingSlot.model');
const Payment = require('../models/Payment.model');
const Court = require('../models/Court.model');
const { generateSlots } = require('../services/slotGenerator.service');
const { calculatePrice } = require('../services/pricing.service');
const mongoose = require('mongoose');

// @desc    Create new booking
// @route   POST /api/admin/bookings
// @access  Private (Admin only)
const createBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            customerName,
            customerPhone,
            sportType,
            courtId,
            bookingDate,
            startTime,
            endTime,
            discountType,
            discountValue,
            advancePaid,
            paymentMode,
            paymentNotes
        } = req.body;

        // 1. Validate Court
        const court = await Court.findById(courtId);
        if (!court) {
            throw new Error('Court not found');
        }
        if (court.status !== 'ACTIVE') {
            throw new Error('Court is not active');
        }

        // 2. Generate Slots
        const slots = generateSlots(startTime, endTime);
        if (slots.length === 0) {
            throw new Error('Invalid time range');
        }

        // 3. Check Slot Availability (Double Double Check)
        // We use the unique index in DB as safety, but checking here gives better error msg
        // 3. Check Slot Availability (Double Double Check)
        // We use the unique index in DB as safety, but checking here gives better error msg
        const rawConflicts = await BookingSlot.find({
            courtId,
            bookingDate: new Date(bookingDate),
            slotTime: { $in: slots }
        }).populate('bookingId').session(session);

        const activeConflicts = rawConflicts.filter(slot =>
            slot.bookingId && slot.bookingId.status === 'BOOKED'
        );

        if (activeConflicts.length > 0) {
            const takenTimes = [...new Set(activeConflicts.map(s => s.slotTime))].join(', ');
            return res.status(409).json({ message: `Slots already booked: ${takenTimes}` });
        }

        // --- CRITICAL FIX: Clean up "Zombie" slots ---
        // If we are here, it means any existing slots in rawConflicts belong to CANCELLED/COMPLETED bookings.
        // We MUST delete them to avoid Unique Index (11000) errors during insertion.
        if (rawConflicts.length > 0) {
            const zombieIds = rawConflicts.map(s => s._id);
            await BookingSlot.deleteMany({ _id: { $in: zombieIds } }).session(session);
        }

        // 4. Calculate Pricing
        const baseAmount = calculatePrice(court, slots.length, new Date(bookingDate));
        let finalAmount = baseAmount;

        if (discountType === 'PERCENT') {
            finalAmount -= (baseAmount * (discountValue || 0)) / 100;
        } else if (discountType === 'FLAT') {
            finalAmount -= (discountValue || 0);
        }

        if (advancePaid > finalAmount) {
            throw new Error('Advance cannot be more than final amount');
        }

        // 5. Create Booking
        const booking = await Booking.create([{
            customerName,
            customerPhone,
            sportType,
            courtId,
            bookingDate: new Date(bookingDate),
            startTime,
            endTime,
            totalSlots: slots.length,
            baseAmount,
            discountType,
            discountValue,
            finalAmount,
            createdBy: req.user._id,
            status: 'BOOKED'
        }], { session });

        // 6. Create Slots
        const bookingSlots = slots.map(time => ({
            bookingId: booking[0]._id,
            courtId,
            bookingDate: new Date(bookingDate),
            slotTime: time
        }));

        await BookingSlot.insertMany(bookingSlots, { session });

        // 7. Create Payment
        await Payment.create([{
            bookingId: booking[0]._id,
            totalAmount: finalAmount,
            advancePaid: advancePaid || 0,
            balanceAmount: finalAmount - (advancePaid || 0),
            paymentMode: paymentMode || 'CASH',
            paymentNotes,
            status: (advancePaid || 0) <= 0 ? 'PENDING' :
                (advancePaid || 0) >= finalAmount ? 'PAID' : 'PARTIAL'
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            bookingId: booking[0]._id
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Slot already booked (Race Condition Detected)' });
        }
        res.status(400).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Check slot availability
// @route   POST /api/admin/bookings/check-availability
// @access  Private (Admin only)
const checkAvailability = async (req, res) => {
    try {
        const { courtId, bookingDate, startTime, endTime } = req.body;
        const slots = generateSlots(startTime, endTime);

        const rawConflicts = await BookingSlot.find({
            courtId,
            bookingDate: new Date(bookingDate),
            slotTime: { $in: slots }
        }).populate('bookingId');

        const activeConflicts = rawConflicts.filter(slot =>
            slot.bookingId && slot.bookingId.status === 'BOOKED'
        );

        if (activeConflicts.length > 0) {
            return res.status(200).json({
                available: false,
                conflictingSlots: [...new Set(activeConflicts.map(s => s.slotTime))]
            });
        }

        res.status(200).json({ available: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all bookings with filters
// @route   GET /api/admin/bookings
// @access  Private (Admin only)
const getAllBookings = async (req, res) => {
    try {
        const { date, courtId, status, search, paymentStatus } = req.query;

        // Build Query
        const query = {};

        // Date Filter
        if (date) {
            // Match exactly that date (ignoring time)
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.bookingDate = { $gte: startDate, $lte: endDate };
        }

        // Court Filter
        if (courtId) {
            query.courtId = courtId;
        }

        // Booking Status Filter
        if (status) {
            query.status = status;
        }

        // Search (Customer Name or Phone)
        if (search) {
            query.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch Bookings
        // sort by date descending (newest first)
        let bookings = await Booking.find(query)
            .populate('courtId', 'name sportType') // Get court details
            .sort({ createdAt: -1 });

        // Payment Status Filter (requires lookup in Payment model or separate query)
        // Since Payment is separate, we can either:
        // 1. Fetch all bookings then filter (ok for small scale)
        // 2. Aggregate (better for perf)
        // For simplicity and matching current structure, we'll fetch payments for each booking 
        // OR better: use virtual populate if setup, or just manual mapping.

        // Let's do a prompt lookup for payments to attach status
        // This is N+1 but acceptable for admin dashboard with pagination usually (or limited range)
        const bookingIds = bookings.map(b => b._id);
        const payments = await Payment.find({ bookingId: { $in: bookingIds } });

        const bookingsWithPayment = bookings.map(booking => {
            const payment = payments.find(p => p.bookingId.toString() === booking._id.toString());
            return {
                ...booking.toObject(),
                paymentStatus: payment ? payment.status : 'UNKNOWN',
                paymentDetails: payment
            };
        });

        // Filter by Payment Status in memory if requested
        let finalResults = bookingsWithPayment;
        if (paymentStatus) {
            finalResults = finalResults.filter(b => b.paymentStatus === paymentStatus);
        }

        res.status(200).json(finalResults);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Update booking status
// @route   PATCH /api/admin/bookings/:id/status
// @access  Private (Admin only)
const updateBookingStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { status } = req.body; // BOOKED, COMPLETED, CANCELLED
        const booking = await Booking.findById(req.params.id).session(session);

        if (!booking) {
            throw new Error('Booking not found');
        }

        // If cancelling, remove slots so others can book
        if (status === 'CANCELLED' && booking.status !== 'CANCELLED') {
            await BookingSlot.deleteMany({ bookingId: booking._id }).session(session);
        }

        // If un-cancelling (re-booking), we should check availability again strictly speaking,
        // but for simplicity for Admin override, we might skip or fail if taken.
        // For now, let's assume Admin knows what they are doing or simple status update.
        // PRO TIP: Re-booking a cancelled slot is complex, let's assume this is mostly for valid flows.

        booking.status = status;
        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Booking status updated', booking });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Delete booking
// @route   DELETE /api/admin/bookings/:id
// @access  Private (Admin only)
const deleteBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(req.params.id).session(session);

        if (!booking) {
            throw new Error('Booking not found');
        }

        // 1. Delete Slots
        await BookingSlot.deleteMany({ bookingId: booking._id }).session(session);

        // 2. Delete Payment
        await Payment.deleteMany({ bookingId: booking._id }).session(session);

        // 3. Delete Booking
        await Booking.deleteOne({ _id: booking._id }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Booking deleted successfully' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update entire booking details
// @route   PUT /api/admin/bookings/:id
// @access  Private (Admin only)
const updateBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            customerName,
            customerPhone,
            sportType,
            courtId,
            bookingDate,
            startTime,
            endTime,
            discountType,
            discountValue,
            advancePaid,
            paymentMode,
            paymentNotes,
            status,
            paymentStatus // Added explicit payment status
        } = req.body;

        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // --- 1. Handle Schedule/Court Changes & Slot Management ---
        const isScheduleChanged =
            booking.courtId.toString() !== courtId ||
            new Date(booking.bookingDate).toISOString() !== new Date(bookingDate).toISOString() ||
            booking.startTime !== startTime ||
            booking.endTime !== endTime;

        const isActiveStatus = status === 'BOOKED';
        const wasActiveStatus = booking.status === 'BOOKED';

        let finalSlots = [];
        let finalAmount = booking.finalAmount;
        let baseAmount = booking.baseAmount;
        let totalSlots = booking.totalSlots;

        // Helper to recalculate params
        const court = await Court.findById(courtId);
        if (!court || court.status !== 'ACTIVE') throw new Error('Invalid or Inactive Court');
        const potentialSlots = generateSlots(startTime, endTime);
        if (potentialSlots.length === 0) throw new Error('Invalid time range');
        const calculatedBaseAmount = calculatePrice(court, potentialSlots.length, new Date(bookingDate));

        // Logic Branch
        if (isActiveStatus) {
            // Case A: Booking is Active (BOOKED)
            // We need to validate and reserve slots if:
            // 1. The schedule explicitly changed
            // 2. OR The booking was previously Inactive (meaning it has no slots, so we must reserve them now)

            if (isScheduleChanged || !wasActiveStatus) {
                // A1. Check Conflicts (Exclude THIS booking's slots)
                const rawConflicts = await BookingSlot.find({
                    courtId,
                    bookingDate: new Date(bookingDate),
                    slotTime: { $in: potentialSlots },
                    bookingId: { $ne: booking._id }
                }).populate('bookingId').session(session);

                const activeConflicts = rawConflicts.filter(slot =>
                    slot.bookingId && slot.bookingId.status === 'BOOKED'
                );

                if (activeConflicts.length > 0) {
                    const takenTimes = [...new Set(activeConflicts.map(s => s.slotTime))].join(', ');
                    throw new Error(`Slots already booked: ${takenTimes}`);
                }

                // --- CRITICAL FIX: Clean up "Zombie" slots ---
                if (rawConflicts.length > 0) {
                    const zombieIds = rawConflicts.map(s => s._id);
                    await BookingSlot.deleteMany({ _id: { $in: zombieIds } }).session(session);
                }

                // A2. Update Amounts based on new schedule
                baseAmount = calculatedBaseAmount;
                totalSlots = potentialSlots.length;
                finalSlots = potentialSlots;

                // A3. Apply Discount
                let priceAfterDiscount = baseAmount;
                if (discountType === 'PERCENT') {
                    priceAfterDiscount -= (baseAmount * (discountValue || 0)) / 100;
                } else if (discountType === 'FLAT') {
                    priceAfterDiscount -= (discountValue || 0);
                }
                finalAmount = Math.max(0, priceAfterDiscount);

                // A4. Update Slots in DB
                // First delete any existing (from old schedule or if inconsistent)
                await BookingSlot.deleteMany({ bookingId: booking._id }).session(session);

                // Insert new
                const bookingSlotDocs = potentialSlots.map(time => ({
                    bookingId: booking._id,
                    courtId,
                    bookingDate: new Date(bookingDate),
                    slotTime: time
                }));
                await BookingSlot.insertMany(bookingSlotDocs, { session });

            } else {
                // Case B: Active and Schedule UNCHANGED
                // Just update pricing if discount changed
                if (discountType !== booking.discountType || discountValue !== booking.discountValue) {
                    let priceAfterDiscount = baseAmount; // existing base
                    if (discountType === 'PERCENT') {
                        priceAfterDiscount -= (baseAmount * (discountValue || 0)) / 100;
                    } else if (discountType === 'FLAT') {
                        priceAfterDiscount -= (discountValue || 0);
                    }
                    finalAmount = Math.max(0, priceAfterDiscount);
                }
            }
        } else {
            // Case C: Booking is Inactive (CANCELLED or COMPLETED)
            // We must FREE the slots.

            // C1. Delete Slots
            await BookingSlot.deleteMany({ bookingId: booking._id }).session(session);

            // C2. Update metadata (amounts) if schedule changed, just for record keeping
            if (isScheduleChanged) {
                baseAmount = calculatedBaseAmount;
                totalSlots = potentialSlots.length;

                let priceAfterDiscount = baseAmount;
                if (discountType === 'PERCENT') {
                    priceAfterDiscount -= (baseAmount * (discountValue || 0)) / 100;
                } else if (discountType === 'FLAT') {
                    priceAfterDiscount -= (discountValue || 0);
                }
                finalAmount = Math.max(0, priceAfterDiscount);
            } else {
                // Even if schedule didn't change, check discount
                if (discountType !== booking.discountType || discountValue !== booking.discountValue) {
                    let priceAfterDiscount = baseAmount;
                    if (discountType === 'PERCENT') {
                        priceAfterDiscount -= (baseAmount * (discountValue || 0)) / 100;
                    } else if (discountType === 'FLAT') {
                        priceAfterDiscount -= (discountValue || 0);
                    }
                    finalAmount = Math.max(0, priceAfterDiscount);
                }
            }
        }

        // --- 2. Update Booking Record ---
        booking.customerName = customerName;
        booking.customerPhone = customerPhone;
        booking.sportType = sportType;
        booking.courtId = courtId;
        booking.bookingDate = new Date(bookingDate);
        booking.startTime = startTime;
        booking.endTime = endTime;
        booking.totalSlots = totalSlots;
        booking.baseAmount = baseAmount;
        booking.discountType = discountType;
        booking.discountValue = discountValue;
        booking.finalAmount = finalAmount;
        booking.status = status; // Already assigned or defaulted in body destructure

        await booking.save({ session });

        // --- 3. Update Payment Record ---
        // Find payment for this booking
        let payment = await Payment.findOne({ bookingId: booking._id }).session(session);
        if (payment) {
            payment.totalAmount = finalAmount;
            payment.advancePaid = advancePaid || 0;
            payment.balanceAmount = Math.max(0, finalAmount - (advancePaid || 0));
            payment.paymentMode = paymentMode;
            payment.paymentNotes = paymentNotes;

            // Logic: Use manual status if provided, otherwise auto-calculate
            if (paymentStatus) {
                payment.status = paymentStatus;
            } else {
                payment.status = (advancePaid || 0) <= 0 ? 'PENDING' :
                    (advancePaid || 0) >= finalAmount ? 'PAID' : 'PARTIAL';
            }

            await payment.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, message: 'Booking updated successfully', booking });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(400).json({ message: error.message || 'Update failed' });
    }
};

module.exports = {
    createBooking,
    checkAvailability,
    getAllBookings,
    updateBookingStatus,
    deleteBooking,
    updateBooking
};
