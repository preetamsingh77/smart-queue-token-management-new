/**
 * CivicFlow — Set User Role Script
 * 
 * Usage:
 *   node setUserRole.js <email> <role>
 * 
 * Roles: ADMIN | OFFICER | CITIZEN
 * 
 * Examples:
 *   node setUserRole.js admin@youroffice.gov ADMIN
 *   node setUserRole.js officer1@youroffice.gov OFFICER
 */

const { initAdmin, auth, db } = require('./firebaseAdmin');

const VALID_ROLES = ['ADMIN', 'OFFICER', 'CITIZEN'];

async function setUserRole(email, role) {
    if (!email || !role) {
        console.error('❌  Usage: node setUserRole.js <email> <role>');
        console.error('    Roles: ADMIN | OFFICER | CITIZEN');
        process.exit(1);
    }

    const upperRole = role.toUpperCase();
    if (!VALID_ROLES.includes(upperRole)) {
        console.error(`❌  Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
        process.exit(1);
    }

    await initAdmin();

    try {
        const userRecord = await auth().getUserByEmail(email);
        console.log(`✅  Found user: ${userRecord.displayName || 'Unknown'} (${userRecord.uid})`);

        await auth().setCustomUserClaims(userRecord.uid, { role: upperRole });
        console.log(`🔑  Custom claim set: role=${upperRole}`);

        const profileRef = db().collection('profiles').doc(userRecord.uid);
        await profileRef.set({
            role: upperRole,
            email: email,
            full_name: userRecord.displayName || '',
            updated_at: new Date().toISOString(),
        }, { merge: true });
        console.log(`📄  Firestore profile updated with role=${upperRole}`);

        console.log(`\n🎉  Done! ${email} is now an ${upperRole}.`);
        console.log(`    They must sign out and back in for the role to take effect.`);
        process.exit(0);

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`❌  No Firebase user found with email: ${email}`);
            console.error(`    Make sure they have signed up first via the app.`);
        } else {
            console.error('❌  Error:', error.message);
        }
        process.exit(1);
    }
}

const [, , email, role] = process.argv;
setUserRole(email, role);
