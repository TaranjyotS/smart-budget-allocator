from sqlalchemy.orm import Session
from app.models.models import IncomeStream, Expense, AssetAccount


def seed_database(db: Session):
    if db.query(IncomeStream).count() > 0:
        return

    db.add(IncomeStream(name="Bi-weekly Salary 1", amount=1800, frequency="bi-weekly"))
    db.add(IncomeStream(name="Bi-weekly Salary 2", amount=1800, frequency="bi-weekly"))

    expenses = [
        ("Mortgage/Rent", "Fixed Expenses", 900, "monthly", "1st of each month"),
        ("Phone Bill", "Fixed Expenses", 113, "monthly", "5th of each month"),
        ("Car Insurance", "Fixed Expenses", 160, "monthly", "21st of each month"),
        ("Groceries", "Non-Fixed Expenses", 0, "monthly", None),
        ("Gym Fees", "Monthly Memberships", 35, "monthly", "17th of each month"),
        ("Bank Monthly Fees", "Fixed Expenses", 17, "monthly", "25th of each month"),
        ("Dining Out", "Non-Fixed Expenses", 0, "monthly", None),
        ("Shopping", "Non-Fixed Expenses", 0, "monthly", None),
        ("Trips", "Non-Fixed Expenses", 0, "monthly", None),
        ("Gym Trainer", "Non-Fixed Expenses", 0, "monthly", None),
        ("Miscellaneous", "Non-Fixed Expenses", 0, "monthly", None),
        ("Car Gas", "Non-Fixed Expenses", 0, "monthly", None),
        ("Medical", "Non-Fixed Expenses", 0, "monthly", None),
        ("Costco", "Yearly Memberships", 147, "yearly", "1st Dec each year"),
        ("Blossom", "Yearly Memberships", 60, "yearly", "11th May each year"),
    ]

    for name, category, amount, frequency, due_date in expenses:
        db.add(Expense(name=name, category=category, amount=amount, frequency=frequency, due_date=due_date))

    assets = [
        ("Chequing", 1100, 5000, 1),
        ("Savings", 400, 20000, 2),
        ("Wealthsimple", 500, 10000, 3),
    ]

    for name, balance, target, priority in assets:
        db.add(AssetAccount(name=name, balance=balance, target=target, priority=priority))

    db.commit()
