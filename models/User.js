const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phonenumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    plan: { type: String, required: true },
    planDuration: { type: String, required: true },
    active: { type: Boolean, default: true },
    specialUrl: { type: String, required: true },
    address: { type: String, required: true },
    aadhar: { type: String, required: false }, // Optional
    username: { type: String, required: true, unique: true },
    qrCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
