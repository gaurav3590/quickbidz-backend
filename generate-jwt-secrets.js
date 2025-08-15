const crypto = require('crypto');

// Generate JWT access token secret
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Generate JWT refresh token secret (different from the main secret)
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log(`
Generated JWT Secrets:
----------------------
JWT_SECRET="${jwtSecret}"
JWT_REFRESH_SECRET="${jwtRefreshSecret}"

Add these to your .env file
`);
