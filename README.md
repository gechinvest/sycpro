# SmartYield Capital (SYC)

A professional, full-stack investment platform built with React, Node.js, and Supabase.

## 🚀 Features

- **10 Investment Levels (v1 - v10)**: Ranging from 500 ETB to 200,000 ETB.
- **Automated Payment Verification**: Integration ready for **Telebirr**, **CBE Birr**, and **Abyssinia Bank** to verify deposits instantly.
- **20% Daily ROI**: Automated profit distribution for 65 days.
- **Bank Transfer Integration**: Manual verification of FT IDs and screenshots.
- **3-Level Referral System**: Earn 10%, 5%, and 2% from your network.
- **Professional Dashboard**: Track balance, earnings, and active investments.
- **Admin Panel**: Review deposits, manage users, and monitor the platform.

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, JWT, Multer, Cloudinary.
- **Database**: Supabase (PostgreSQL) with Row Level Security.

## 📋 Setup Instructions

### 1. Database Setup (Supabase CLI & Docker)
- Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- Ensure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
- To create and start the database automatically in Docker:
  ```bash
  npm run supabase:start
  ```
- This command will:
  - Pull necessary Docker images.
  - Start PostgreSQL, Auth, and other Supabase services.
  - Automatically apply migrations from `supabase/migrations`.
- To check the status of your local environment: `npm run supabase:status`.
- To stop the database: `npm run supabase:stop`.

### 2. Linking to Remote Supabase (Optional)
- If you want to use a hosted Supabase project:
  - Login: `supabase login`.
  - Link: `supabase link --project-ref your_project_ref`.
  - Push schema: `npm run db:push`.

### 2. Backend Configuration
- Navigate to the `backend` folder.
- Rename `.env.example` to `.env`.
- Fill in your Supabase credentials (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), JWT secret, and Cloudinary keys.
- The `SUPABASE_SERVICE_ROLE_KEY` is required for admin operations and registration bonuses.

### 3. Running the App
- Run the fully functional app with a single command: `npm start`.

## 🆘 Troubleshooting

### 1. "Could not find the 'account_name' column of 'bank_accounts' in the schema cache"
This error happens when the Supabase API cache is stale. 
**Fix:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Run the following command:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
4. This will refresh the API cache and the error should disappear.

### 2. Login 404 Error
If you get a 404 error during login on Vercel:
- Ensure your `VITE_API_URL` in Vercel ends with `/api` (e.g., `https://your-backend.vercel.app/api`).
- Check that you have deployed the backend correctly with the provided `vercel.json` files.

- This will install all dependencies and start both backend and frontend.

### 4. ROI Automation
- The ROI logic is located in `backend/services/roiService.js`.
- In production, set up a cron job to call the `processDailyRoi` function every 24 hours.

## 💰 Investment Packages

| Plan | Amount | Daily Profit (20%) | Total (65 Days) |
|------|--------|-------------------|-----------------|
| v1   | 500    | 100               | 6,500           |
| v2   | 1,000  | 200               | 13,000          |
| v3   | 1,500  | 300               | 19,500          |
| v4   | 2,500  | 500               | 32,500          |
| v5   | 4,000  | 800               | 52,000          |
| v6   | 8,000  | 1,600             | 104,000         |
| v7   | 15,000 | 3,000             | 195,000         |
| v8   | 50,000 | 10,000            | 650,000         |
| v9   | 100,000| 20,000            | 1,300,000       |
| v10  | 200,000| 40,000            | 2,600,000       |

## 🔐 Security
- JWT-based authentication.
- Supabase Row Level Security (RLS) ensures users only see their own data.
- Manual admin verification for all deposits.

---
Built with ❤️ for SmartYield Capital.
