const mongoose = require('mongoose');

const bookingSlotSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
    },
    courtId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true,
    },
    bookingDate: {
        type: Date,
        required: true,
    },
    slotTime: {
        type: String, // e.g. "06:00", "06:15"
        required: true,
    },
}, { timestamps: true });

// Prevent double booking: A slot can only exist once for a specific court and date
bookingSlotSchema.index({ courtId: 1, bookingDate: 1, slotTime: 1 }, { unique: true });

module.exports = mongoose.model('BookingSlot', bookingSlotSchema);
