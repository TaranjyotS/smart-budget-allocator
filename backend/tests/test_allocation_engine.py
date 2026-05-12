from app.core.allocation_engine import calculate_summary, recommend_allocation


def test_calculate_summary():
    incomes = [{"amount": 3600, "frequency": "monthly", "active": True}]
    expenses = [{"amount": 1000, "frequency": "monthly", "active": True}]
    assets = [{"balance": 1000, "target": 5000}]
    result = calculate_summary(incomes, expenses, assets)
    assert result["monthly_surplus"] == 2600
    assert result["months_to_goal"] == 2


def test_recommend_allocation():
    assets = [
        {"name": "Chequing", "balance": 1100, "target": 5000, "priority": 1},
        {"name": "Savings", "balance": 400, "target": 20000, "priority": 2},
        {"name": "Wealthsimple", "balance": 500, "target": 10000, "priority": 3},
    ]
    result = recommend_allocation(1000, assets)
    assert len(result["allocations"]) == 3
    assert sum(item["amount"] for item in result["allocations"]) <= 1000.01
    assert {item["account"] for item in result["allocations"]} == {"Chequing", "Savings", "Wealthsimple"}
