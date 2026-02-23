const { initAdmin, db, auth } = require('./firebaseAdmin');

async function main() {
    console.log('🔥  CivicFlow — Connection Test');
    console.log('================================\n');

    await initAdmin();

    // Test Auth
    console.log('Test 1: Firebase Auth...');
    try {
        const result = await auth().listUsers(1);
        console.log('  ✅ Auth connected — total users fetched:', result.users.length, '\n');
    } catch (e) {
        console.error('  ❌ Auth FAILED:', e.message, '\n');
    }

    // Test Firestore
    console.log('Test 2: Firestore write...');
    try {
        await db().collection('_health').doc('ping').set({ ts: new Date().toISOString(), ok: true });
        console.log('  ✅ Firestore connected — write successful!\n');
    } catch (e) {
        console.error('  ❌ Firestore FAILED:', e.message, '\n');
    }

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
