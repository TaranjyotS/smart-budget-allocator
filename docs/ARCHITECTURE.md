# Architecture

```text
React UI
  |
  | REST API
  v
FastAPI Backend
  |
  | SQLAlchemy
  v
SQLite Database

Optional:
Google Sheets CSV or Google Sheets API
  |
  v
FastAPI Import Layer
```

## Components

### Frontend

- React
- Vite
- Recharts
- CSS responsive UI

### Backend

- FastAPI
- SQLAlchemy
- SQLite
- Google Sheets API integration
- CSV import

### Data Model

- IncomeStream
- Expense
- AssetAccount
- Transaction

## Flexibility

The app does not hard-code expense columns. Instead, it treats expenses and income streams as flexible records.

That means you can add:

- new categories
- new income streams
- yearly expenses
- one-time expenses
- custom due dates
- notes

without changing source code.
