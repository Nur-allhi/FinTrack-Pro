import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MANAGEMENT_API_KEY = process.env.SUPABASE_MANAGEMENT_API_KEY;

const SQL = `
CREATE TABLE IF NOT EXISTS loans (
  id BIGSERIAL PRIMARY KEY,
  lender_account_id BIGINT NOT NULL,
  borrower_account_id BIGINT NOT NULL,
  amount REAL NOT NULL,
  date_given DATE NOT NULL,
  due_date DATE,
  interest_rate REAL,
  particulars TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled', 'defaulted')),
  settled_date DATE,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
`;

async function runViaManagementAPI() {
  if (!MANAGEMENT_API_KEY) {
    console.log("SUPABASE_MANAGEMENT_API_KEY not set. Skipping Management API path.");
    return false;
  }
  if (!SUPABASE_URL) {
    console.log("SUPABASE_URL not set.");
    return false;
  }
  const projectRef = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.log("Could not extract project ref from SUPABASE_URL.");
    return false;
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MANAGEMENT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Management API returned ${res.status}: ${text}`);
    return false;
  }

  console.log("Migration applied successfully via Management API.");
  return true;
}

async function main() {
  console.log("Running Supabase migration...");

  if (await runViaManagementAPI()) return;

  console.log(`
Could not run migration automatically.

To apply the migration manually:
1. Go to https://supabase.com/dashboard/project/_/sql/new
   (replace '_' with your project ref from SUPABASE_URL)
2. Paste and run the following SQL:

${SQL}
`);
}

main().catch(console.error);
