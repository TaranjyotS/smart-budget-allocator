# Vercel Build Fix

Use npm instead of pnpm/corepack on Vercel.

Recommended Vercel project settings:

- Root Directory: `frontend`
- Install Command: `npm install --legacy-peer-deps --no-audit --no-fund`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js Version: `20.x`

Environment variable:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

After changing settings, redeploy using **Redeploy without Build Cache**.
