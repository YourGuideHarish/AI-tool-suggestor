# AI Task Router

Describe any task → get the best free AI tools, Claude skills, connectors, and an AI vs manual effort split. Powered by Gemini 2.5 Flash (free API). No accounts needed for your users.

## What it does

- Asks 2-3 clarifying questions about your task
- Recommends the best FREE AI tool for the job
- Surfaces relevant **Claude Skills** (DOCX, PPTX, XLSX, PDF, frontend-design, etc.)
- Surfaces relevant **Claude Connectors** (Google Drive, Gmail, Canva, GitHub, Slack, etc.)
- Shows an **AI vs manual effort split** with a visual bar
- Gives step-by-step instructions
- Knowledge auto-updates — Gemini reasons about the latest tools on every query

## Deploy in 10 minutes (free)

### Step 1 — Get a free Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with any Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

No credit card. 1,500 requests/day free.

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "initial"
gh repo create ai-task-router --public --push
# or push manually to github.com
```

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
2. Click "Add New Project" → Import your `ai-task-router` repo
3. In "Environment Variables", add:
   - Key: `GEMINI_API_KEY`
   - Value: your key from Step 1
4. Click "Deploy"

You'll get a URL like `https://ai-task-router.vercel.app` — share it with anyone.

### Local development

```bash
cp .env.example .env.local
# paste your Gemini key into .env.local
npm install
npm run dev
# open http://localhost:3000
```

## Architecture

```
User browser → Next.js page (client)
                    ↓ POST /api/route
              Next.js API route (server/edge)
                    ↓ Gemini API call (key stays server-side)
              Gemini 2.5 Flash
                    ↓ JSON response
              Back to browser
```

The Gemini API key is **never exposed to the browser**. It lives only in Vercel's environment variables and is called server-side. Your users never need accounts or API keys.

## Customising

- **System prompt**: Edit `src/app/api/route/route.ts` — the `SYSTEM_PROMPT` constant. Add tools specific to your audience.
- **Styling**: Edit `src/app/globals.css` — all CSS variables are at the top.
- **Questions**: The `QUESTIONS_PROMPT` drives what clarifying questions get asked.

## Rate limits

Gemini free tier: ~1,500 requests/day, 15 requests/minute. For a personal tool or small audience this is plenty. If you go viral, you can add a paid Gemini key with no code changes — just swap the env variable.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Gemini 2.5 Flash API (free tier)
- Vercel (free hosting)
- Zero external dependencies beyond Next.js
