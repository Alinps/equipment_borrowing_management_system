
const mongoose = require('../database/db');

const borrowRecordSchema = new mongoose.Schema({

    borrower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Borrower',
        required: true
    },

    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Equipment',
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    borrowedAt:{
        type: Date,
        default: Date.now
    },

    expectedReturnDate: {
        type: Date,
        required: true
    },

    actualReturnDate: {
        type: Date
    },

    status: {
        type: String,
        enum: [
            'BORROWED',
            'RETURNED',
            'OVERDUE'
        ],
        default: 'BORROWED'
    },

    remarks: {
        type: String
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);