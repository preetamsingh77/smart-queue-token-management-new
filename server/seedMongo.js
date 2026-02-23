require('dotenv').config();
const mongoose = require('mongoose');
const { Service, Counter } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicflow';

const SERVICES = [
    { id: 'aadhaar', name: 'Aadhaar Services', prefix: 'A', description: 'UIDAI services', avg_time_minutes: 10, is_active: true, subServices: ['Enrollment', 'Update'], color: '#3B82F6', icon: '🪪' },
    { id: 'passport', name: 'Passport Office', prefix: 'P', description: 'Passport application', avg_time_minutes: 20, is_active: true, subServices: ['New Issue', 'Renewal'], color: '#8B5CF6', icon: '📘' },
    { id: 'pension', name: 'Pension Department', prefix: 'PE', description: 'Pension schemes', avg_time_minutes: 15, is_active: true, subServices: ['Widow Pension', 'Old Age'], color: '#10B981', icon: '🏦' },
    { id: 'revenue', name: 'Revenue & Tax', prefix: 'R', description: 'Land and Property Tax', avg_time_minutes: 12, is_active: true, subServices: ['Property Tax', 'Water Tax'], color: '#F59E0B', icon: '📋' },
    { id: 'health', name: 'Health Services', prefix: 'H', description: 'Public Health', avg_time_minutes: 8, is_active: true, subServices: ['Vaccination', 'OPD'], color: '#EF4444', icon: '🏥' },
    { id: 'education', name: 'Education Bureau', prefix: 'E', description: 'School and Grants', avg_time_minutes: 10, is_active: true, subServices: ['Scholarship', 'Admissions'], color: '#6366F1', icon: '🎓' },
    { id: 'property', name: 'Property Registration', prefix: 'PR', description: 'Registration of Land', avg_time_minutes: 25, is_active: true, subServices: ['Sale Deed', 'Gift Deed'], color: '#14B8A6', icon: '🏠' },
    { id: 'employment', name: 'Employment Exchange', prefix: 'EX', description: 'Job Registration', avg_time_minutes: 12, is_active: true, subServices: ['New Registration', 'Renewal'], color: '#F97316', icon: '💼' },
    { id: 'utilities', name: 'Utilities & Water', prefix: 'U', description: 'Utility Payments', avg_time_minutes: 9, is_active: true, subServices: ['Electricity Bill', 'Water Connection'], color: '#0EA5E9', icon: '💧' },
    { id: 'legal', name: 'Legal Aid Services', prefix: 'L', description: 'Legal help', avg_time_minutes: 30, is_active: true, subServices: ['Counseling', 'Affidavit'], color: '#EC4899', icon: '⚖️' },
    { id: 'emergency', name: 'Emergency Services', prefix: 'EM', description: 'Emergency Assistance', avg_time_minutes: 5, is_active: true, subServices: ['Ambulance', 'Fire'], color: '#DC2626', icon: '🚨' }
];

const COUNTERS = [
    { id: 1, name: 'Counter 01', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Aadhaar Services', 'Passport Office'] },
    { id: 2, name: 'Counter 02', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Pension Department', 'Revenue & Tax'] },
    { id: 3, name: 'Counter 03', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Health Services', 'Emergency Services'] },
    { id: 4, name: 'Counter 04', status: 'OFFLINE', isOnline: false, isActive: true, assignedServices: ['Education Bureau', 'Employment Exchange'] },
    { id: 5, name: 'Counter 05', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Property Registration', 'Legal Aid Services'] }
];

mongoose.connect(MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');

    // Clear existings
    await Service.deleteMany({});
    await Counter.deleteMany({});

    // Insert new
    await Service.insertMany(SERVICES);
    await Counter.insertMany(COUNTERS);

    console.log('🚀 Seeded MongoDB with default Services & Counters!');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
