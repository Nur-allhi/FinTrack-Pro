const parseAdminEmails = (raw?: string): string[] => {
  if (!raw) return [];
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
};

export const config = {
  admin: {
    emails: parseAdminEmails(process.env.ADMIN_EMAILS)
  }
};
