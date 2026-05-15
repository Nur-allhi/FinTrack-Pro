const parseAdminEmails = (raw?: string): string[] => {
  if (!raw) return [];
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
};

export const config = {
  auth: {
    username: process.env.AUTH_USERNAME || 'admin',
    password: process.env.AUTH_PASSWORD || 'password123',
    tokenPrefix: process.env.AUTH_TOKEN_PREFIX || 'dev-session-token-'
  },
  admin: {
    emails: parseAdminEmails(process.env.ADMIN_EMAILS)
  }
};
