/**
 * CivicFlow — Clock Offset Patcher
 * 
 * Fetches Google's real current time, calculates the offset from the 
 * system clock, and patches Date.now() so the Admin SDK generates 
 * valid JWTs regardless of system clock skew.
 * 
 * This is the CORRECT way to handle a machine with an out-of-sync clock
 * without requiring admin/root privileges.
 */

const https = require('https');

/**
 * Fetches Google's current UTC time from their OAuth server's Date header.
 * Returns the offset in milliseconds to add to system time.
 */
function getGoogleClockOffset() {
    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: 'oauth2.googleapis.com',
                port: 443,
                path: '/token',
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            },
            (res) => {
                const googleServerTime = new Date(res.headers['date']);
                const systemTime = new Date();
                const offsetMs = googleServerTime.getTime() - systemTime.getTime();

                console.log(`  System UTC : ${systemTime.toUTCString()}`);
                console.log(`  Google UTC : ${googleServerTime.toUTCString()}`);
                console.log(`  Offset     : ${Math.round(offsetMs / 1000)}s (${Math.round(offsetMs / 3600000 * 10) / 10}h)`);

                resolve(offsetMs);
            }
        );
        req.on('error', reject);
        req.write('grant_type=probe');
        req.end();
    });
}

/**
 * Patches Date.now() and the Date constructor to add the given offset.
 * This makes every subsequent call to new Date() / Date.now() return
 * the Google-aligned time, so Admin SDK JWTs are valid.
 */
let alreadyPatched = false;
function patchClock(offsetMs) {
    if (alreadyPatched) return;
    alreadyPatched = true;

    if (Math.abs(offsetMs) < 30000) {
        console.log('  ✅ Clock is within 30 seconds of Google — no patch needed.');
        return;
    }

    const originalNow = Date.now;
    const OriginalDate = Date;

    // Patch Date.now()
    Date.now = () => originalNow() + offsetMs;

    // Patch new Date() with no args
    const PatchedDate = function (...args) {
        if (args.length === 0) {
            return new OriginalDate(originalNow() + offsetMs);
        }
        return new OriginalDate(...args);
    };

    // Copy all static methods
    Object.setPrototypeOf(PatchedDate, OriginalDate);
    PatchedDate.prototype = OriginalDate.prototype;
    PatchedDate.now = () => originalNow() + offsetMs;
    PatchedDate.UTC = OriginalDate.UTC;
    PatchedDate.parse = OriginalDate.parse;

    global.Date = PatchedDate;

    console.log(`  ✅ Clock patched: +${Math.round(offsetMs / 1000)}s applied to all Date calls.`);
}

module.exports = { getGoogleClockOffset, patchClock };
