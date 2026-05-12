from math import ceil
from typing import Dict, List


def monthly_value(amount: float, frequency: str) -> float:
    frequency = (frequency or "monthly").lower().replace("-", "")
    if frequency == "weekly":
        return amount * 52 / 12
    if frequency in {"biweekly", "bi-weekly"}:
        return amount * 26 / 12
    if frequency == "yearly":
        return amount / 12
    if frequency == "one-time":
        return amount
    return amount


def calculate_summary(incomes: List[dict], expenses: List[dict], assets: List[dict]) -> Dict:
    monthly_income = sum(monthly_value(i["amount"], i.get("frequency", "monthly")) for i in incomes if i.get("active", True))
    monthly_expenses = sum(monthly_value(e["amount"], e.get("frequency", "monthly")) for e in expenses if e.get("active", True))
    surplus = monthly_income - monthly_expenses
    current_net_worth = sum(a["balance"] for a in assets)
    target_net_worth = sum(a["target"] for a in assets)
    gap = max(0, target_net_worth - current_net_worth)
    months_to_goal = ceil(gap / surplus) if surplus > 0 else None

    return {
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "monthly_surplus": round(surplus, 2),
        "current_net_worth": round(current_net_worth, 2),
        "target_net_worth": round(target_net_worth, 2),
        "gap": round(gap, 2),
        "months_to_goal": months_to_goal,
    }


def recommend_allocation(surplus: float, assets: List[dict]) -> Dict:
    if surplus <= 0:
        return {
            "message": "No positive monthly surplus available. Reduce expenses or increase income before allocating.",
            "allocations": [],
        }

    active_goals = []
    for asset in assets:
        gap = max(0, float(asset["target"]) - float(asset["balance"]))
        if gap > 0:
            active_goals.append({**asset, "gap": gap})

    if not active_goals:
        return {
            "message": "All tracked goals are fully funded. Allocate new surplus to your highest-return investment goal or add a new goal.",
            "allocations": [],
        }

    # Lower priority number receives higher weight. Gap size also matters.
    weighted = []
    for asset in active_goals:
        priority = max(1, int(asset.get("priority") or 1))
        weight = asset["gap"] / priority
        weighted.append((asset, weight))

    total_weight = sum(weight for _, weight in weighted) or 1
    allocations = []
    for asset, weight in weighted:
        amount = min(asset["gap"], surplus * weight / total_weight)
        allocations.append({
            "account": asset["name"],
            "amount": round(amount, 2),
            "reason": f"Priority {asset.get('priority', 1)} goal with ${asset['gap']:.2f} remaining.",
        })

    message = "Surplus is distributed dynamically across all active goals based on remaining gap and priority. Add or edit goals to change the allocation behavior."
    return {"message": message, "allocations": allocations}
