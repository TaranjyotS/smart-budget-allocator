import React, { useEffect, useState } from "react";
import { api } from "./api/client";
import Dashboard from "./components/Dashboard";
import Expenses from "./components/Expenses";
import IncomeStreams from "./components/IncomeStreams";
import Goals from "./components/Goals";
import AllocationCards from "./components/AllocationCards";
import GoogleSheetsImport from "./components/GoogleSheetsImport";
import TaxPlanner from "./components/TaxPlanner";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setError("");
      const [summaryRes, incomeRes, expenseRes, assetRes] = await Promise.all([
        api.getSummary(),
        api.getIncome(),
        api.getExpenses(),
        api.getAssets(),
      ]);
      setSummary(summaryRes);
      setIncome(incomeRes);
      setExpenses(expenseRes);
      setAssets(assetRes);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const tabs = [
    ["dashboard", "Dashboard"],
    ["income", "Income"],
    ["expenses", "Expenses"],
    ["goals", "Goals"],
    ["allocator", "Allocator"],
    ["sheets", "Google Sheets"],
    ["tax", "Tax Planner"],
  ];

  return (
    <div className="app">
      <header className="hero hero-polished">
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">Personal Finance System</p>
          <h1 className="hero-title">Smart Budget Tracker & Asset Allocator</h1>
          <p className="hero-subtitle">Track income, expenses, goals, Google Sheets imports, and smart salary allocation in one place.</p>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <nav className="tabs">
        {tabs.map(([key, label]) => (
          <button className={activeTab === key ? "active" : ""} key={key} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "dashboard" && <Dashboard summary={summary} expenses={expenses} assets={assets} />}
      {activeTab === "income" && <IncomeStreams income={income} refresh={refresh} />}
      {activeTab === "expenses" && <Expenses expenses={expenses} refresh={refresh} />}
      {activeTab === "goals" && <Goals assets={assets} refresh={refresh} />}
      {activeTab === "allocator" && <AllocationCards summary={summary} />}
      {activeTab === "sheets" && <GoogleSheetsImport refresh={refresh} />}
      {activeTab === "tax" && <TaxPlanner />}
    </div>
  );
}
