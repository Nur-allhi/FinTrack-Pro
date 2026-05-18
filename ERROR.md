❯ npm run dev

> react-example@0.0.0 dev
> tsx --env-file .env api/index.ts

Using Supabase as the database.
Server is running on http://localhost:3001
POST /api/loans error: {
  code: '23502',
  details: 'Failing row contains (9, 23, null, 150000, 2026-04-30, 2026-05-31, null, Gave for no business, active, null, 148d0f43-06d9-4e75-8fa6-5ce48a5dbafe, Sharif Vai, 150000).',
  hint: null,
  message: 'null value in column "borrower_account_id" of relation "loans" violates not-null constraint'
}

(index):1 Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
:3001/api/loans:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
