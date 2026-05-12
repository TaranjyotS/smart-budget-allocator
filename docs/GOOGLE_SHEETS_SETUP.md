# Google Sheets Setup

## Option A: CSV Import

This is the easiest method.

1. Create or open your Google Sheet.
2. Use these columns:

```text
type,name,category,amount,frequency,due_date,notes
```

3. Download as CSV.
4. Upload it in the web app under **Google Sheets Import**.

---

## Option B: Live Google Sheets API Sync

### 1. Create Google Cloud Project

Create a project in Google Cloud Console.

### 2. Enable Google Sheets API

Enable:

```text
Google Sheets API
```

### 3. Create Service Account

Create a service account and download the JSON key file.

### 4. Place JSON File

Put it in the project root or backend folder as:

```text
google_service_account.json
```

### 5. Share Your Sheet

Share your Google Sheet with the service account email.

### 6. Update `.env`

```text
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_FILE=./google_service_account.json
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SHEET_RANGE=Budget!A1:Z1000
```

### 7. Run Sync

Open the UI and click:

```text
Sync Google Sheet
```
