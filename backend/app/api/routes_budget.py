from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import IncomeStream, Expense
from app.schemas.schemas import IncomeCreate, IncomeOut, ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/budget", tags=["Budget"])


@router.get("/income", response_model=list[IncomeOut])
def list_income(db: Session = Depends(get_db)):
    return db.query(IncomeStream).all()


@router.post("/income", response_model=IncomeOut)
def create_income(payload: IncomeCreate, db: Session = Depends(get_db)):
    item = IncomeStream(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/income/{income_id}", response_model=IncomeOut)
def update_income(income_id: int, payload: IncomeCreate, db: Session = Depends(get_db)):
    item = db.query(IncomeStream).filter(IncomeStream.id == income_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Income stream not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/income/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db)):
    item = db.query(IncomeStream).filter(IncomeStream.id == income_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Income stream not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}


@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).all()


@router.post("/expenses", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    item = Expense(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, payload: ExpenseCreate, db: Session = Depends(get_db)):
    item = db.query(Expense).filter(Expense.id == expense_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    item = db.query(Expense).filter(Expense.id == expense_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}
