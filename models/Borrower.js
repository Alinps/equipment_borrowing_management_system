const mongoose = require('../database/db')

const borrowerSchema  = new mongoose.Schema({
    name:{
        type:String,
        trim: true,
        required: true,
        minlength:3,
        maxlength:30,
    },
    email:{
        type:String,
        trim: true,
        unique: true,
        lowercare: true,
        required: true
    },
    phoneNumber:{
        type: Number,
        trim:true,
        required:true,
        validate: {
        validator: function(value) {
        return /^[6-9]\d{9}$/.test(value);
        },
            message: 'Please enter a valid phone number'
        }
    },
    department: {
        type:String,
        trim: true,
        required: true
    }
},{
    timestamps: true
})

module.exports = mongoose.model('Borrower', borrowerSchema);