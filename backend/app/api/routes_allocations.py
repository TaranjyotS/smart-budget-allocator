from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import IncomeStream, Expense, AssetAccount
from app.core.allocation_engine import calculate_summary, recommend_allocation

router = APIRouter(prefix="/allocations", tags=["Allocations"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    incomes = [i.__dict__ for i in db.query(IncomeStream).all()]
    expenses = [e.__dict__ for e in db.query(Expense).all()]
    assets = [a.__dict__ for a in db.query(AssetAccount).all()]
    summary = calculate_summary(incomes, expenses, assets)
    allocation = recommend_allocation(summary["monthly_surplus"], assets)
    return {"summary": summary, "recommendation": allocation}
