from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

from app.core.config import get_settings
from app.core.database import get_db
from app.models.models import Expense, IncomeStream
from app.api.routes_imports import normalize_row

router = APIRouter(prefix="/google-sheets", tags=["Google Sheets"])


@router.get("/status")
def status():
    settings = get_settings()
    return {
        "enabled": settings.google_sheets_enabled,
        "sheet_id_configured": bool(settings.google_sheet_id),
        "range": settings.google_sheet_range,
    }


@router.post("/sync")
def sync_google_sheet(db: Session = Depends(get_db)):
    settings = get_settings()

    if not settings.google_sheets_enabled:
        raise HTTPException(status_code=400, detail="Google Sheets integration is disabled in .env")

    if not settings.google_sheet_id:
        raise HTTPException(status_code=400, detail="GOOGLE_SHEET_ID is missing")

    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    credentials = Credentials.from_service_account_file(settings.google_service_account_file, scopes=scopes)
    service = build("sheets", "v4", credentials=credentials)
    result = service.spreadsheets().values().get(
        spreadsheetId=settings.google_sheet_id,
        range=settings.google_sheet_range,
    ).execute()

    rows = result.get("values", [])
    if len(rows) < 2:
        return {"imported": 0, "message": "No importable rows found"}

    headers = [str(h).strip().lower() for h in rows[0]]
    imported = 0

    for row in rows[1:]:
        padded = row + [""] * (len(headers) - len(row))
        data = dict(zip(headers, padded))
        parsed = normalize_row(data)
        if not parsed:
            continue

        if parsed["is_income"]:
            db.add(IncomeStream(name=parsed["name"], amount=parsed["amount"], frequency=parsed["frequency"]))
        else:
            db.add(Expense(
                name=parsed["name"],
                category=parsed["category"],
                amount=parsed["amount"],
                frequency=parsed["frequency"],
                due_date=parsed["due_date"],
                notes=parsed["notes"],
            ))
        imported += 1

    db.commit()
    return {"imported": imported}
