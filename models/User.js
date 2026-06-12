const mongoose = require('../database/db')
 
const userSchema = new mongoose.Schema({

    username: {
        type:String,
        required: true,
        trim:true,
        minlength:3,
        maxlength:30,
    },
    email: {
        type:String,
        required: true,
        trim: true,
        unique: true,
        lowercase:true,
    },
    password:{
        type: String,
        required: true,
        minlength:8
    },
     department: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [
            'ADMIN',
            'MANAGER',
            'BORROWER'
        ],
        default: 'BORROWER'
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    
},{
    timestamps: true
});

module.exports = mongoose.model('User',userSchema);