from sqlalchemy import Column, Integer, String, Float, Boolean
from app.core.database import Base


class IncomeStream(Base):
    __tablename__ = "income_streams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String, default="monthly")
    active = Column(Boolean, default=True)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String, default="monthly")
    due_date = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    active = Column(Boolean, default=True)


class AssetAccount(Base):
    __tablename__ = "asset_accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    balance = Column(Float, nullable=False)
    target = Column(Float, nullable=False)
    priority = Column(Integer, default=1)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    notes = Column(String, nullable=True)
