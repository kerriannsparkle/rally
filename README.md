# Rally MVP Foundation

A clean React + TypeScript + Vite foundation for Rally.

## Included

- Demo login and signup
- Household dashboard
- Multiple member point balances
- Daily, weekly, monthly, seasonal, and one-time activities
- Household-wide completion behavior
- Multi-contributor activities
- Rewards and point redemption
- Affiliate reward links
- Shared goals
- History
- Create center
- Subscription page
- Household admin controls
- Local browser persistence
- Vercel configuration

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deploy to Vercel

Upload the unzipped project contents to your GitHub repository. Vercel settings:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

## Important

This version runs fully as an interactive prototype and stores data in the browser.

The next production phase is to connect:

- Supabase authentication
- Shared household database
- Secure role permissions
- Stripe billing
- Photo storage
- Amazon Associates tracking
