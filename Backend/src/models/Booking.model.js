const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true,
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true,
    },
    sportType: {
        type: String,
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
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    totalSlots: {
        type: Number,
        required: true,
    },
    baseAmount: {
        type: Number,
        required: true,
    },
    discountType: {
        type: String,
        enum: ['PERCENT', 'FLAT', 'NONE'],
        default: 'NONE',
    },
    discountValue: {
        type: Number,
        default: 0,
    },
    finalAmount: {
        type: Number,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['BOOKED', 'CANCELLED', 'COMPLETED'],
        default: 'BOOKED',
    },
    bookingSource: {
        type: String,
        enum: ['MANUAL', 'RECURRING'],
        default: 'MANUAL',
    },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
