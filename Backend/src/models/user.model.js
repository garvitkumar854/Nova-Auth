const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9_]{3,16}$/, "Please provide a valid username (3-16 characters, no special chars except _)"],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please provide a valid email address"],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true,
        minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false 
    },
}, {
    timestamps: true
})

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
