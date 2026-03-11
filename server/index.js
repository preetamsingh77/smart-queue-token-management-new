require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { Token, Counter, Service, Profile } = require('./models');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const { MongoMemoryServer } = require('mongodb-memory-server');
const { execSync } = require('child_process');

let mongoServer;
const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        if (!uri) {
            console.log('No MONGO_URI found. Starting embedded MongoMemoryServer...');
            mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
            // Automatically patch MONGO_URI for seed script
            process.env.MONGO_URI = uri;
        }

        await mongoose.connect(uri);
        console.log(`Connected to MongoDB at ${uri}`);

        // Auto-seed if running embedded and collections are empty
        const count = await Service.countDocuments();
        if (count === 0 && !process.env.MONGO_URI_PROVIDED) {
            console.log('Database appears empty. Running auto-seed...');
            try {
                execSync('node seedMongo.js', { stdio: 'inherit', env: process.env });
                console.log('Auto-seed complete!');
            } catch (err) {
                console.error('Auto-seed failed:', err.message);
            }
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

connectDB();

// Emit real-time events wrapper
const emitChange = (table) => {
    io.emit('db_change', { table });
};

// ==========================================
// TOKENS API
// ==========================================
app.get('/api/tokens', async (req, res) => {
    try {
        const tokens = await Token.find({ status: { $ne: 'COMPLETED' }, status: { $ne: 'CANCELLED' } }).sort({ created_at: 1 });
        res.json(tokens);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tokens', async (req, res) => {
    try {
        const token = new Token(req.body);
        await token.save();
        emitChange('tokens');
        res.json(token);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/tokens/:id', async (req, res) => {
    try {
        const token = await Token.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        if (!token) return res.status(404).json({ error: 'Token not found' });
        emitChange('tokens');
        res.json(token);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tokens/:id', async (req, res) => {
    try {
        await Token.findOneAndDelete({ id: req.params.id });
        emitChange('tokens');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// SERVICES API
// ==========================================
app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find({ is_active: true }).sort('name');
        res.json(services);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/services', async (req, res) => {
    try {
        const service = new Service(req.body);
        await service.save();
        emitChange('services');
        res.json(service);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/services/:id', async (req, res) => {
    try {
        const service = await Service.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        emitChange('services');
        res.json(service);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/services/:id', async (req, res) => {
    try {
        await Service.findOneAndDelete({ id: req.params.id });
        emitChange('services');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// COUNTERS API
// ==========================================
app.get('/api/counters', async (req, res) => {
    try {
        const counters = await Counter.find().sort('id');
        res.json(counters);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/counters', async (req, res) => {
    try {
        const counter = new Counter(req.body);
        await counter.save();
        emitChange('counters');
        res.json(counter);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/counters/:id', async (req, res) => {
    try {
        const counter = await Counter.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        emitChange('counters');
        res.json(counter);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/counters/:id', async (req, res) => {
    try {
        await Counter.findOneAndDelete({ id: req.params.id });
        emitChange('counters');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// PROFILES API (For Firebase Auth tie-in)
// ==========================================
app.get('/api/profiles/:uid', async (req, res) => {
    try {
        let profile = await Profile.findOne({ uid: req.params.uid });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/profiles', async (req, res) => {
    try {
        let profile = await Profile.findOne({ uid: req.body.uid });
        if (!profile) {
            profile = new Profile(req.body);
            await profile.save();
        } else {
            profile = await Profile.findOneAndUpdate({ uid: req.body.uid }, req.body, { new: true });
        }
        res.json(profile);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/profiles/:uid', async (req, res) => {
    try {
        const profile = await Profile.findOneAndUpdate({ uid: req.params.uid }, req.body, { new: true });
        res.json(profile);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// Start server
const PORT = process.env.PORT || 3008;
server.listen(PORT, () => {
    console.log(`CivicFlow MongoDB Backend API running on port ${PORT}`);
});
