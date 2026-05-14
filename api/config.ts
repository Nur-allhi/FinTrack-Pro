// WARNING: Change AUTH_USERNAME and AUTH_PASSWORD in .env before deploying to production.
// The defaults (admin/password123) are for local development only.
export const config = {
  auth: {
    username: process.env.AUTH_USERNAME || 'admin',
    password: process.env.AUTH_PASSWORD || 'password123',
    tokenPrefix: process.env.AUTH_TOKEN_PREFIX || 'dev-session-token-'
  }
};
