const Booking = require('../models/Booking.model');
const BookingSlot = require('../models/BookingSlot.model');
const Payment = require('../models/Payment.model');
const Court = require('../models/Court.model');
const { generateSlots } = require('./slotGenerator.service');
const { calculatePrice } = require('./pricing.service');

/**
 * Core service to handle single booking creation logic.
 * This is used by both the BookingController (manual bookings)
 * and the RecurringGeneratorService (automatic bookings).
 */
const createSingleBooking = async (bookingData, session) => {
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
        createdBy,
        bookingSource = 'MANUAL',
        // Optional flag to skip some checks if they were done in bulk
        skipAvailabilityCheck = false
    } = bookingData;

    // 1. Validate Court
    const court = await Court.findById(courtId).session(session);
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

    // 3. Check Slot Availability
    if (!skipAvailabilityCheck) {
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
            throw new Error(`Slots already booked: ${takenTimes}`);
        }

        // Clean up "Zombie" slots (from CANCELLED/COMPLETED)
        if (rawConflicts.length > 0) {
            const zombieIds = rawConflicts.map(s => s._id);
            await BookingSlot.deleteMany({ _id: { $in: zombieIds } }).session(session);
        }
    }

    // 4. Calculate Pricing
    const baseAmount = calculatePrice(court, slots.length, new Date(bookingDate));
    let finalAmount = baseAmount;

    if (discountType === 'PERCENT') {
        finalAmount -= (baseAmount * (discountValue || 0)) / 100;
    } else if (discountType === 'FLAT') {
        finalAmount -= (discountValue || 0);
    }

    // Ensure accurate integer
    finalAmount = Math.max(0, Math.ceil(finalAmount));

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
        createdBy,
        status: 'BOOKED',
        bookingSource
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

    return booking[0];
};

module.exports = {
    createSingleBooking
};
