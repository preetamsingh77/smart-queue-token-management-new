/**
 * CivicFlow — Firestore Seed Script
 * 
 * Creates initial services and counters in Firestore.
 * Safe to run multiple times (uses set with merge).
 * 
 * Usage:
 *   node seedFirestore.js
 */

const { initAdmin, db } = require('./firebaseAdmin');

const SERVICES = [
    { id: 'aadhaar', name: 'Aadhaar Services', icon: '🪪', color: '#3B82F6', avgTime: 10 },
    { id: 'passport', name: 'Passport Office', icon: '📘', color: '#8B5CF6', avgTime: 20 },
    { id: 'pension', name: 'Pension Department', icon: '🏦', color: '#10B981', avgTime: 15 },
    { id: 'revenue', name: 'Revenue & Tax', icon: '📋', color: '#F59E0B', avgTime: 12 },
    { id: 'health', name: 'Health Services', icon: '🏥', color: '#EF4444', avgTime: 8 },
    { id: 'education', name: 'Education Bureau', icon: '🎓', color: '#6366F1', avgTime: 10 },
    { id: 'property', name: 'Property Registration', icon: '🏠', color: '#14B8A6', avgTime: 25 },
    { id: 'employment', name: 'Employment Exchange', icon: '💼', color: '#F97316', avgTime: 12 },
    { id: 'utilities', name: 'Utilities & Water', icon: '💧', color: '#0EA5E9', avgTime: 9 },
    { id: 'legal', name: 'Legal Aid Services', icon: '⚖️', color: '#EC4899', avgTime: 30 },
    { id: 'emergency', name: 'Emergency Services', icon: '🚨', color: '#DC2626', avgTime: 5 },
];

const COUNTERS = [
    { id: '1', name: 'Counter 01', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Aadhaar Services', 'Passport Office'] },
    { id: '2', name: 'Counter 02', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Pension Department', 'Revenue & Tax'] },
    { id: '3', name: 'Counter 03', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Health Services', 'Emergency Services'] },
    { id: '4', name: 'Counter 04', status: 'OFFLINE', isOnline: false, isActive: true, assignedServices: ['Education Bureau', 'Employment Exchange'] },
    { id: '5', name: 'Counter 05', status: 'ONLINE', isOnline: true, isActive: true, assignedServices: ['Property Registration', 'Legal Aid Services'] },
];

async function seedServices(firestoreDb) {
    console.log('📦  Seeding services...');
    const batch = firestoreDb.batch();
    SERVICES.forEach((service) => {
        const ref = firestoreDb.collection('services').doc(service.id);
        batch.set(ref, { ...service, createdAt: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
    console.log(`  ✅ ${SERVICES.length} services written.`);
}

async function seedCounters(firestoreDb) {
    console.log('\n🖥️   Seeding counters...');
    const batch = firestoreDb.batch();
    COUNTERS.forEach((counter) => {
        const ref = firestoreDb.collection('counters').doc(counter.id);
        batch.set(ref, { ...counter, currentTokenId: null, createdAt: new Date().toISOString() }, { merge: true });
    });
    await batch.commit();
    console.log(`  ✅ ${COUNTERS.length} counters written.`);
}

async function main() {
    console.log('🔥  CivicFlow — Firestore Seed Script');
    console.log('=====================================\n');

    await initAdmin();

    try {
        const firestoreDb = db();
        await seedServices(firestoreDb);
        await seedCounters(firestoreDb);
        console.log('\n🎉  Firestore seed complete! Your Firebase project now has initial data.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌  Seed failed:', error.message);
        process.exit(1);
    }
}

main();
