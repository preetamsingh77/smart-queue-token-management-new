/**
 * Firebase Admin SDK — Shared Initializer
 * 
 * NOTE: Always call initAdmin() and await it before using db/auth.
 * This ensures clock sync happens before any Firebase calls.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const { getGoogleClockOffset, patchClock } = require('./clockSync');

let initialized = false;

async function initAdmin() {
    if (initialized) return;

    console.log('🕐 Syncing clock with Google servers...');
    const offsetMs = await getGoogleClockOffset();
    patchClock(offsetMs);
    console.log('');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'smart-queue-token-managment',
        });
    }

    initialized = true;
}

const db = () => admin.firestore();
const auth = () => admin.auth();

module.exports = { admin, db, auth, initAdmin };
