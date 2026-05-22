# Smart Budget Tracker & Asset Allocator

A full-stack budget tracking and smart salary allocation system that works as:

1. **Option 1 — Web App:** React UI + FastAPI backend + local SQLite database.
2. **Option 2 — Google Sheets Integration:** Import/export Google Sheets data and optionally sync through the Google Sheets API.

The app is designed around your current budget style: income, fixed expenses, non-fixed expenses, annual memberships, savings, investments, goals, and due dates.

---

## Key Features

- Interactive React dashboard
- Flexible income streams
- Flexible expense categories
- Add new expenses or income sources anytime
- Track monthly planned vs actual spending
- Smart asset allocation suggestions
- Goal tracking for:
  - Chequing: `$5,000`
  - Savings: `$20,000`
  - WealthSimple: `$10,000`
- Google Sheets import through CSV upload
- Optional Google Sheets API sync
- Monthly logs system with yearly tracking
- SQLite database included for local use
- FastAPI backend
- Docker setup
- Clean folder structure
- `.env.example` and `.env` template included
- Seed data based on your current budget screenshot

---

## Current Starting Data

|    Account   | Current | Target |
|--------------|---------|--------|
|   Chequing   |    1100 |   5000 |
|    Savings   |     400 |  20000 |
| WealthSimple |     500 |  10000 |

Monthly income: `3600`

Main expense groups:

- Fixed Expenses
- Non-Fixed Expenses
- Annual Memberships
- Investments/Savings
- Due Dates

---

## Project Structure

```text
smart-budget-allocator/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_allocations.py
│   │   │   ├── routes_assets.py
│   │   │   ├── routes_budget.py
│   │   │   ├── routes_google_sheets.py
│   │   │   └── routes_imports.py
│   │   ├── core/
│   │   │   ├── allocation_engine.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── seed.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_allocation_engine.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── components/
│   │   │   ├── AllocationCards.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── GoogleSheetsImport.jsx
│   │   │   └── IncomeStreams.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   ├── index.html
│   └── Dockerfile
├── google-sheets/
│   ├── AppsScript.gs
│   ├── budget_template.csv
│   └── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── GOOGLE_SHEETS_SETUP.md
│   └── USER_GUIDE.md
├── docker-compose.yml
├── .env.example
├── .env
└── .gitignore
```

---

## One-Click Local Startup

For Windows, you do not need to manually start the backend and frontend every time.

From the project root, double-click:

```text
start-app.bat
```

This script will:

- create the backend Python virtual environment if it does not exist
- install backend requirements
- install frontend npm packages if needed
- start FastAPI on `http://localhost:8000`
- start React/Vite on `http://localhost:5173`
- open the app in your browser
- show your mobile URL for devices on the same Wi-Fi

To stop the local servers, double-click:

```text
stop-app.bat
```

### Mobile Access On Same Wi-Fi

After running `start-app.bat`, the terminal will show a URL like:

```text
http://192.168.x.x:5173
```

Open that URL on your phone while your phone and laptop are connected to the same Wi-Fi.

The frontend now automatically calls the backend using the same laptop IP address, so mobile access works without editing the code.

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

### 3. Docker

```bash
docker compose up --build
```

---

## Google Sheets Import

You can use the system in two ways:

### CSV Import

1. Open your Google Sheet.
2. Go to **File > Download > Comma Separated Values (.csv)**.
3. Upload the CSV in the web UI under **Google Sheets Import**.
4. The system parses rows and adds them to the backend.

### Google Sheets API Sync

Use this if you want live integration.

You need:

- Google Cloud project
- Google Sheets API enabled
- Service account JSON
- Sheet shared with service account email

See:

```text
docs/GOOGLE_SHEETS_SETUP.md
```

---

## Flexibility

Yes, this supports future flexibility.

You can add:

- new expense categories
- new income streams
- extra one-time income
- one-time expenses
- new asset accounts
- new financial goals
- yearly memberships
- due dates
- custom notes

No code change is needed for normal category or income additions.

---

## Smart Allocation Logic

The backend calculates:

- current surplus
- savings gap
- investment gap
- monthly goal progress
- estimated months to goal
- recommended allocation to chequing, savings, and WealthSimple

Default logic:

```text
IF chequing is below target:
    prioritize chequing + savings
ELSE IF savings is below target:
    prioritize savings + investments
ELSE:
    prioritize investments
```

---

## Monthly Logs System

The application includes a fully editable yearly financial ledger.

### Features

- January → December monthly tracking
- Dynamic year selection
- Editable monthly income and expense entries
- Automatic monthly balance calculations
- Synchronization with Income and Expense tabs
- Real-time totals generation

## Important Note

This is a budgeting and planning tool. It does not provide legal, tax, or investment advice. Always verify investment decisions before acting.

---

## Deploying for Mobile Access

This project now includes Vercel frontend support and hosted backend deployment files.

Use this setup:

```text
Frontend: Vercel
Backend: Render / Railway / AWS
Database: SQLite for testing, PostgreSQL/Supabase for long-term use
```

Key deployment files:

```text
frontend/vercel.json
frontend/.env.production.example
frontend/.env.local.example
render.yaml
backend/start.sh
docs/DEPLOYMENT.md
```

After deployment, your phone can access the app from the Vercel URL and your laptop does not need to stay on.

See the full guide here:

```text
docs/DEPLOYMENT.md
```
