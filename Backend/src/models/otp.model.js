const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
},{
    timestamps: true
})

const otpModel = mongoose.model('otp', otpSchema);

module.exports = otpModel;