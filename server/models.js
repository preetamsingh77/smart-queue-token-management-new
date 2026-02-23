const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
    uid: { type: String, required: true, unique: true },
    full_name: String,
    email: String,
    role: { type: String, default: 'CITIZEN' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const TokenSchema = new Schema({
    id: { type: String, required: true, unique: true },
    citizen_name: String,
    phone: String,
    service_id: String,
    service_category: String,
    service_type: String,
    status: { type: String, default: 'WAITING' },
    priority_level: { type: String, default: 'NORMAL' },
    priority_status: { type: String, default: 'NONE' },
    token_number: String,
    number: Number,
    id_proof: String,
    medical_proof: String,
    is_senior: Boolean,
    is_emergency: Boolean,
    is_priority: Boolean,
    rejection_reason: String,
    skip_reason: String,
    created_at: { type: Date, default: Date.now },
    called_at: Date,
    started_at: Date,
    completed_at: Date,
    service_start_time: Number,
    estimated_wait_time: Number,
    counter_id: Number,
    officer_id: String,
    notifications: { type: Array, default: [] }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const CounterSchema = new Schema({
    id: { type: Number, required: true, unique: true },
    name: String,
    current_officer_id: String,
    status: { type: String, default: 'OFFLINE' },
    assignedServices: [String],
    currentTokenId: String,
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: true }
});

const ServiceSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    prefix: String,
    description: String,
    avg_time_minutes: Number,
    is_active: { type: Boolean, default: true },
    subServices: [String],
    color: String,
    icon: String
});

module.exports = {
    Profile: mongoose.model('Profile', ProfileSchema),
    Token: mongoose.model('Token', TokenSchema),
    Counter: mongoose.model('Counter', CounterSchema),
    Service: mongoose.model('Service', ServiceSchema)
};
