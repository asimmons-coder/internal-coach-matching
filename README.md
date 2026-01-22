# Boon Coach Matcher

Internal tool for ad-hoc coach recommendations. Paste a coaching request (like an email from a client) and get AI-powered coach matches with rationale.

## Setup

1. Clone this repo
2. `npm install`
3. Create `.env.local` with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. `npm run dev`

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel dashboard
4. Deploy

## Updating Coach Data

Replace `coaches.json` with fresh export from Supabase and redeploy.
