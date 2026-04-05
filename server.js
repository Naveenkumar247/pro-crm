require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const path = require('path');
const User = require('./models/User');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Serves static files from 'public' folder

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- ROUTES ---

// 1. Dashboard API (Gets stats for the home page)
app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ active: true });
        const inactiveUsers = totalUsers - activeUsers;
        
        // Mock data for cold calls and reminders (you can build schemas for these later)
        const coldCalls = 42; 
        const reminders = 12;

        res.json({ totalUsers, activeUsers, inactiveUsers, coldCalls, reminders });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// 2. Fetch all users for the dashboard table
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 3. Serve the HTML Form
app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// 4. Handle Form Submission
app.post('/api/users', async (req, res) => {
    try {
        const { name, phonenumber, email, plan, planDuration, active, address, aadhar } = req.body;
        const isActive = active === 'true';

        // Generate Username
        const baseUsername = name.replace(/\s+/g, '').toLowerCase();
        const randomNum = Math.floor(Math.random() * 10000);
        const username = `${baseUsername}${randomNum}`;

        // Create the dexys.in Special URL
        const specialUrl = `https://dexys.in/user/${username}`;

        // Generate QR Code containing the special URL
        const qrCodeBase64 = await QRCode.toDataURL(specialUrl);

        // Save to Database
        const newUser = new User({
            name, phonenumber, email, plan, planDuration, 
            active: isActive, address, aadhar, username, 
            specialUrl, qrCode: qrCodeBase64
        });
        
        await newUser.save();
        res.redirect('/?success=true'); // Redirect back to home dashboard on success

    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving user. Make sure the email is unique.');
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
