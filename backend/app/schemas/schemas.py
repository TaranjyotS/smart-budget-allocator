from pydantic import BaseModel
from typing import Optional


class IncomeCreate(BaseModel):
    name: str
    amount: float
    frequency: str = "monthly"
    active: bool = True


class IncomeOut(IncomeCreate):
    id: int

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    name: str
    category: str
    amount: float
    frequency: str = "monthly"
    due_date: Optional[str] = None
    notes: Optional[str] = None
    active: bool = True


class ExpenseOut(ExpenseCreate):
    id: int

    class Config:
        from_attributes = True


class AssetCreate(BaseModel):
    name: str
    balance: float
    target: float
    priority: int = 1


class AssetOut(AssetCreate):
    id: int

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    date: str
    name: str
    category: str
    type: str
    amount: float
    notes: Optional[str] = None


class TransactionOut(TransactionCreate):
    id: int

    class Config:
        from_attributes = True
