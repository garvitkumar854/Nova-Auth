const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: ["User ID is required", "Please provide a valid User ID"],
    },
    refreshTokenHash: {
        type: String,
        required: ["Refresh Token Hash is required", "Please provide a valid Refresh Token Hash"],
    },
    ip: {
        type: String,
        required: ["IP Address is required", "Please provide a valid IP Address"],
    },
    userAgent: {
        type: String,
        required: ["User Agent is required", "Please provide a valid User Agent"],
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const sessionModel = mongoose.model('Session', sessionSchema);

module.exports = sessionModel;