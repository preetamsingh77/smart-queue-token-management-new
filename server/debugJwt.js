/**
 * Debug: Check if the service account key can generate a JWT
 * and verify the timestamps are within range
 */
const crypto = require('crypto');
const serviceAccount = require('./serviceAccountKey.json');

function base64url(str) {
    return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const now = Math.floor(Date.now() / 1000);
const header = { alg: 'RS256', typ: 'JWT', kid: serviceAccount.private_key_id };
const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
};

const signingInput = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(payload));

console.log('=== JWT Debug Info ===');
console.log('iat (issued at):', now, '->', new Date(now * 1000).toUTCString());
console.log('exp (expires at):', now + 3600, '->', new Date((now + 3600) * 1000).toUTCString());
console.log('System UTC now:', new Date().toUTCString());
console.log('Key ID:', serviceAccount.private_key_id);
console.log('Client Email:', serviceAccount.client_email);
console.log('Project ID:', serviceAccount.project_id);
console.log('');

try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');
    console.log('✅ Private key is valid — can sign JWT');
    console.log('JWT prefix:', signingInput.substring(0, 40) + '...');
} catch (e) {
    console.error('❌ Private key error:', e.message);
}
