/**
 * Fetch Google's actual current time from their API to compare with system time
 */
const https = require('https');

const options = {
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
};

// We'll just look at the Date header in the response
const req = https.request(options, (res) => {
    console.log('=== Google Server Time ===');
    console.log('Google Date header:', res.headers['date']);
    console.log('System time (UTC):', new Date().toUTCString());

    const googleTime = new Date(res.headers['date']);
    const systemTime = new Date();
    const diffMs = systemTime - googleTime;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);

    console.log('');
    console.log('Time difference:', diffMins, 'minutes (' + diffHours + ' hours)');
    if (Math.abs(diffMins) > 5) {
        console.log('❌ CLOCK SKEW DETECTED — system clock is', diffMins > 0 ? 'AHEAD' : 'BEHIND', 'by', Math.abs(diffMins), 'minutes');
    } else {
        console.log('✅ Clock appears in sync with Google');
    }
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write('grant_type=invalid'); // Send invalid data, we just want the Date header
req.end();
