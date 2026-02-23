/**
 * CivicFlow — List All Firebase Users
 * 
 * Usage:
 *   node listUsers.js
 * 
 * Prints a table of all registered users with their UID, email, display name, and role.
 */

const admin = require('firebase-admin');
const { initAdmin } = require('./firebaseAdmin');

async function listAllUsers(nextPageToken) {
    await initAdmin();
    const result = await admin.auth().listUsers(1000, nextPageToken);

    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│           CivicFlow — Registered Users                      │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ Email                          │ Name            │ Role      │');
    console.log('├─────────────────────────────────────────────────────────────┤');

    result.users.forEach((user) => {
        const role = (user.customClaims && user.customClaims.role) || 'CITIZEN';
        const email = (user.email || 'N/A').padEnd(30).substring(0, 30);
        const name = (user.displayName || 'Unknown').padEnd(15).substring(0, 15);
        const roleStr = role.padEnd(9);
        console.log(`│ ${email} │ ${name} │ ${roleStr} │`);
    });

    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log(`\nTotal users: ${result.users.length}`);

    if (result.pageToken) {
        await listAllUsers(result.pageToken);
    }
}

listAllUsers().catch((error) => {
    console.error('❌  Error listing users:', error.message);
    process.exit(1);
});
