
const mongoose = require('../database/db');

const borrowSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Equipment',
        required: true
    },
    borrowDate:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Borrow', borrowSchema);