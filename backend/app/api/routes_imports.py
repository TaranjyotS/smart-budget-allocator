import csv
import io
import re
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import IncomeStream, Expense

router = APIRouter(prefix="/imports", tags=["Imports"])

AMOUNT_KEYS = ("amount", "cost", "price", "payment", "value", "total", "monthly", "yearly")
NAME_KEYS = ("name", "item", "description", "expense", "income", "category", "account", "membership")
CATEGORY_KEYS = ("category", "type", "bucket", "group")
FREQUENCY_KEYS = ("frequency", "freq", "recurrence", "period", "billing")
DUE_KEYS = ("due", "date", "due_date", "due date", "payment date")
INCOME_WORDS = ("income", "salary", "pay", "paycheque", "paycheck", "bonus", "deposit", "revenue", "freelance")
EXPENSE_WORDS = ("expense", "rent", "bill", "fee", "fees", "grocery", "shopping", "gas", "medical", "insurance", "trip")
MEMBERSHIP_WORDS = ("membership", "subscription", "sub", "costco", "chatgpt", "netflix", "spotify", "gym")


def clean_amount(value):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = text.replace("$", "").replace(",", "")
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    if not match:
        return None
    return float(match.group())


def find_by_keys(row, keys):
    for key, value in row.items():
        normalized = str(key or "").strip().lower()
        if any(k in normalized for k in keys) and value not in (None, ""):
            return value
    return None


def detect_amount(row):
    direct = find_by_keys(row, AMOUNT_KEYS)
    amount = clean_amount(direct)
    if amount is not None:
        return amount
    for value in row.values():
        amount = clean_amount(value)
        if amount is not None:
            return amount
    return None


def row_text(row):
    return " ".join(str(v).lower() for v in row.values() if v is not None)


def detect_frequency(row):
    explicit = str(find_by_keys(row, FREQUENCY_KEYS) or "").strip().lower()
    text = f"{explicit} {row_text(row)}"
    if "bi" in text and "week" in text:
        return "biweekly"
    if "week" in text:
        return "weekly"
    if "annual" in text or "year" in text:
        return "yearly"
    if "one" in text and "time" in text:
        return "one-time"
    return "monthly"


def detect_name(row):
    value = find_by_keys(row, NAME_KEYS)
    if value:
        return str(value).strip()
    for value in row.values():
        if value and clean_amount(value) is None:
            return str(value).strip()
    return "Imported Item"


def detect_category(row, frequency):
    text = row_text(row)
    explicit = str(find_by_keys(row, CATEGORY_KEYS) or "").strip()
    explicit_l = explicit.lower()
    if any(word in text for word in MEMBERSHIP_WORDS) or "membership" in explicit_l or "subscription" in explicit_l:
        return "Yearly Memberships" if frequency == "yearly" else "Monthly Memberships"
    if explicit:
        if "fixed" in explicit_l:
            return "Fixed Expenses"
        if "non" in explicit_l or "variable" in explicit_l:
            return "Non-Fixed Expenses"
        return explicit
    if any(word in text for word in ("rent", "insurance", "phone", "utilities", "fee")):
        return "Fixed Expenses"
    return "Non-Fixed Expenses"


def is_income(row):
    text = row_text(row)
    explicit = str(find_by_keys(row, CATEGORY_KEYS) or "").lower()
    return any(word in text or word in explicit for word in INCOME_WORDS) and not any(word in text for word in ("expense", "rent", "bill"))


def normalize_row(row):
    clean = {str(k or "").strip().lower(): (v.strip() if isinstance(v, str) else v) for k, v in row.items() if k is not None}
    amount = detect_amount(clean)
    if amount is None:
        return None
    frequency = detect_frequency(clean)
    name = detect_name(clean)
    category = detect_category(clean, frequency)
    due_date = find_by_keys(clean, DUE_KEYS)
    notes = find_by_keys(clean, ("notes", "note", "comment", "comments"))
    return {
        "is_income": is_income(clean),
        "name": name,
        "amount": amount,
        "frequency": frequency,
        "category": category,
        "due_date": str(due_date).strip() if due_date else None,
        "notes": str(notes).strip() if notes else None,
    }


@router.post("/csv")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    imported = {"income": 0, "expenses": 0, "skipped": 0}

    for row in reader:
        parsed = normalize_row(row)
        if not parsed:
            imported["skipped"] += 1
            continue

        if parsed["is_income"]:
            db.add(IncomeStream(name=parsed["name"], amount=parsed["amount"], frequency=parsed["frequency"]))
            imported["income"] += 1
        else:
            db.add(Expense(
                name=parsed["name"],
                category=parsed["category"],
                amount=parsed["amount"],
                frequency=parsed["frequency"],
                due_date=parsed["due_date"],
                notes=parsed["notes"],
            ))
            imported["expenses"] += 1

    db.commit()
    return imported
