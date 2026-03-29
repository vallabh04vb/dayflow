# DayFlow

Personal daily task tracker with email reminders. Self-hosted on Railway with Node.js + SQLite.

## Features

- Daily task list with drag-and-drop reordering
- Progress tracking with streak counter
- Plan Tomorrow modal and auto-continuation at midnight
- 4 configurable daily email reminders (morning, start, afternoon, evening)
- History view with GitHub-style heatmap
- Mobile-responsive design
- First-run setup wizard

## Local Development

```bash
# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env
# Edit .env with your email credentials

# Start the server
npm start
# or with auto-reload
npm run dev
```

Visit `http://localhost:3000`

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create dayflow --private --push
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `dayflow` repository
4. Railway will auto-detect Node.js and deploy

### 3. Set Environment Variables

In Railway dashboard → your service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `EMAIL_USER` | Your Gmail address (e.g. `you@gmail.com`) |
| `EMAIL_PASS` | Gmail App Password (see below) |
| `RECIPIENT_EMAIL` | Email to receive reminders |
| `APP_URL` | Your Railway URL (e.g. `https://dayflow-production.up.railway.app`) |
| `TZ` | `Asia/Kolkata` |
| `PORT` | `3000` (Railway usually sets this automatically) |

### 4. Gmail App Password Setup

Gmail requires an **App Password** (not your regular password) for SMTP:

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (enable if not already)
3. At the bottom of 2-Step Verification page → **App passwords**
4. Select app: "Mail", device: "Other" → name it "DayFlow"
5. Copy the 16-character password → use as `EMAIL_PASS`

### 5. Verify Deployment

1. Visit your Railway URL — you should see the setup wizard
2. Complete setup with your name and email
3. Go to Settings → click "Send Test Email"
4. Check Railway **Logs** tab to verify cron jobs are running:
   - You should see: `[Cron] Scheduled: midnight auto-continuation, email reminders`
   - Email sends will log: `[Mailer] Sent: ...`

### 6. IST Timezone

Setting `TZ=Asia/Kolkata` ensures:
- All cron jobs fire at IST times
- Date calculations use IST
- Email timestamps show IST

## SQLite Persistence on Railway

Railway uses ephemeral storage by default. For persistent SQLite:

1. In Railway dashboard, add a **Volume**
2. Mount it at `/app/data` (or similar)
3. Update `db.js` to use the volume path, or set a `DB_PATH` env var

> Without a volume, the database resets on each deploy. For a personal app with daily tasks, this is usually fine if you redeploy infrequently.

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite via better-sqlite3
- **Email**: Nodemailer + Gmail SMTP
- **Scheduler**: node-cron
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
