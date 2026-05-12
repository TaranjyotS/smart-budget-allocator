# Deployment Guide: Vercel Frontend + Hosted Backend

This project can run locally with one click, but for phone access from anywhere you should deploy the frontend and backend online.

## Recommended Production Architecture

```text
Phone / Laptop Browser
        ↓
Vercel React Frontend
        ↓
Hosted FastAPI Backend, for example Render or Railway
        ↓
SQLite for simple demos, or PostgreSQL/Supabase for long-term use
```

## 1. Push the project to GitHub

```bash
git init
git add .
git commit -m "Initial smart budget allocator app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## 2. Deploy the backend first

Recommended simple option: Render.

1. Create a new Render Web Service.
2. Connect your GitHub repository.
3. Set the root directory to `backend`.
4. Build command:

```bash
pip install -r requirements.txt
```

5. Start command:

```bash
./start.sh
```

6. Add environment variables:

```env
ENVIRONMENT=production
DATABASE_URL=sqlite:///./smart_budget.db
CORS_ORIGINS=*
GOOGLE_SHEETS_ENABLED=false
```

After deployment, copy your backend URL, for example:

```text
https://smart-budget-allocator-api.onrender.com
```

## 3. Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Set the project root directory to `frontend`.
3. Framework preset: Vite.
4. Build command:

```bash
npm run build
```

5. Output directory:

```text
dist
```

6. Add this Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

7. Deploy.

## 4. Use on mobile

Open the Vercel URL on your phone:

```text
https://your-budget-tracker.vercel.app
```

Your laptop does not need to stay on. The deployed frontend talks to the hosted backend.

## Important production note

SQLite is okay for a personal prototype, but hosted platforms may reset local files depending on the plan. For serious long-term use, switch `DATABASE_URL` to PostgreSQL using Render PostgreSQL, Railway PostgreSQL, or Supabase.

## Local development still works

Backend:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

Or use:

```text
start-app.bat
```

## Deployment Troubleshooting Notes

### Render pydantic-core / maturin / cargo error
If Render shows an error involving `pydantic-core`, `maturin`, `cargo`, or Python `3.14`, make sure the backend service uses Python `3.11.9`.

This project includes:

- `.python-version`
- `backend/.python-version`
- `PYTHON_VERSION=3.11.9` in `render.yaml`

In Render, also verify:

```text
Environment Variable: PYTHON_VERSION = 3.11.9
Root Directory: backend
Build Command: pip install --upgrade pip && pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Vercel npm ci error
If Vercel fails with `npm ci exited with 1`, either:

1. Set Root Directory to `frontend`, or
2. Keep Root Directory as repo root and use the root `vercel.json` included in this project.

This project now uses `npm install` instead of `npm ci` to avoid failing when the lockfile is missing or out of sync on GitHub.
