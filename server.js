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
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- API ROUTES ---

app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ active: true });
        const inactiveUsers = totalUsers - activeUsers;
        const coldCalls = 42; 
        const reminders = 12;
        res.json({ totalUsers, activeUsers, inactiveUsers, coldCalls, reminders });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Fetch a single user by username
app.get('/api/users/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { name, phonenumber, email, plan, planDuration, active, address, aadhar } = req.body;
        const isActive = active === 'true';

        // Generate Username
        const baseUsername = name.replace(/\s+/g, '').toLowerCase();
        const randomNum = Math.floor(Math.random() * 10000);
        const username = `${baseUsername}${randomNum}`;

        // Hidden Special URL
        const specialUrl = `https://dexys.in/user/${username}`;

        // The requested MongoDB string for the QR Code
        const customQrString = `mongodb+srv://Naveenkumar:mushroom%23nk24@collegenz.yjjzybn.mongodb.net/collegenz?appName=Collegenz/user/${username}`;

        // Generate QR Code containing the custom string
        const qrCodeBase64 = await QRCode.toDataURL(customQrString);

        // Save to Database
        const newUser = new User({
            name, phonenumber, email, plan, planDuration, 
            active: isActive, address, aadhar, username, 
            specialUrl, qrCode: qrCodeBase64
        });
        
        await newUser.save();
        res.redirect('/?success=true');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving user. Make sure the email is unique.');
    }
});

// --- PAGE ROUTES ---

app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// Scanner Page Route
app.get('/scan', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

// Dynamic User Profile Page Route
app.get('/user/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
