# Solar App Free Deployment (No Public IP Needed)

This repo is now prepared for:
- Backend: Render (free)
- Web: Render Static Site (free)
- Database: TiDB Serverless (free)
- Mobile APK: EAS Build

## 1) Push code to GitHub
1. Create a GitHub repo.
2. Push this project.

## 2) Create free MySQL-compatible DB (TiDB Serverless)
1. Create TiDB Serverless cluster.
2. Create database: `solar_app`.
3. Create DB user/password.
4. Save host/port/user/password.

## 3) Deploy Backend + Web on Render Blueprint
1. Render -> New -> Blueprint.
2. Connect your GitHub repo.
3. Render reads `render.yaml` and creates:
   - `solarapp-backend` (Node API)
   - `solarapp-web` (Static web)
4. Provide backend env vars from `solarapp-backend/.env.render.example`:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `ALLOWED_ORIGINS`
5. After backend URL is assigned, set web env var:
   - `VITE_API_URL=https://<your-backend-url>/api`
6. Set backend `ALLOWED_ORIGINS` to include your Render web URL.
7. Redeploy both services.
8. Verify health endpoint:
   - `https://<your-backend-url>/api/health`

## 4) Update backend CORS for web domain
In Render env vars set:
- `ALLOWED_ORIGINS=https://<your-render-web-url>,http://localhost:5173`
Then redeploy backend.

## 5) Initialize first admin
Call this once:
- `POST https://<your-render-url>/api/auth/init-admin`

## 6) Build mobile APK with live API URL
`solarapp-mobile/eas.json` is prepared with:
- `EXPO_PUBLIC_API_URL`

Before final build, replace placeholder URL in:
- `solarapp-mobile/eas.json`

Then run:
1. `cd solarapp-mobile`
2. `npx eas login`
3. `npx eas build --platform android --profile production`

## Notes
- Render free instance sleeps when idle; first request can be slow.
- If login fails in web, re-check `ALLOWED_ORIGINS`.
- If mobile points to old API, rebuild APK after updating EAS env URL.
