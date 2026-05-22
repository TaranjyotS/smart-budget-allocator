import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function generateYearMonthKeys(year) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

function monthlyValue(amount, frequency) {
  const normalized = String(frequency || "monthly").toLowerCase().replace("-", "");
  const value = Number(amount || 0);
  if (normalized === "weekly") return value * 52 / 12;
  if (normalized === "biweekly") return value;
  if (normalized === "yearly") return value / 12;
  return value;
}

function valueClass(type, value) {
  if (type === "income") return "log-income";
  if (type === "expense") return "log-expense";
  if (Number(value) === 0) return "log-zero";
  return Number(value) > 0 ? "log-income" : "log-expense";
}

function availableYears() {
  return Array.from({ length: 31 }, (_, index) => 2020 + index);
}

export default function MonthlyLogs({ income = [], expenses = [], refresh }) {
  const currentKey = monthKey();
  const [selectedYear, setSelectedYear] = useState(Math.min(2050, Math.max(2020, new Date().getFullYear())));
  const [logs, setLogs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("monthlyBudgetLogs") || "{}");
    } catch {
      return {};
    }
  });
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("monthlyBudgetLogNotes") || "{}");
    } catch {
      return {};
    }
  });
  const [noteCell, setNoteCell] = useState(null);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const yearListRef = useRef(null);
  const yearDropdownRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("monthlyBudgetLogs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("monthlyBudgetLogNotes", JSON.stringify(notes));
  }, [notes]);


  useEffect(() => {
    if (!yearMenuOpen) return;

    function handleOutsideClick(event) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setYearMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setYearMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [yearMenuOpen]);

  useEffect(() => {
    if (!yearMenuOpen || !yearListRef.current) return;
    const selectedIndex = availableYears().findIndex(year => year === selectedYear);
    const defaultIndex = Math.max(0, availableYears().findIndex(year => year === 2025));
    const rowHeight = 42;
    yearListRef.current.scrollTop = (selectedIndex >= 0 ? Math.max(0, selectedIndex - 1) : defaultIndex) * rowHeight;
  }, [yearMenuOpen, selectedYear]);

  const incomeColumns = useMemo(() => income.map(item => ({
    key: `income:${item.id}`,
    id: item.id,
    label: item.name,
    type: "income",
    item,
  })), [income]);

  const expenseColumns = useMemo(() => expenses.map(item => ({
    key: `expense:${item.id}`,
    id: item.id,
    label: item.name,
    type: "expense",
    item,
  })), [expenses]);

  const columns = [...expenseColumns, ...incomeColumns];
  const months = generateYearMonthKeys(selectedYear);

  function currentValue(column) {
    return monthlyValue(column.item.amount, column.item.frequency);
  }

  function getValue(month, column) {
    // The current month is always sourced from the live Income/Expense tabs so stale
    // local log values cannot override the active budget. Edits to current month
    // still sync back to the backend immediately.
    if (month === currentKey) return Number(currentValue(column) ?? 0);
    return Number(logs[month]?.[column.key] ?? 0);
  }

  function getTotals(month) {
    const totalIncome = incomeColumns.reduce((sum, col) => sum + getValue(month, col), 0);
    const totalExpense = expenseColumns.reduce((sum, col) => sum + getValue(month, col), 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }

  async function updateCurrentMonthBackend(column, value) {
    if (column.type === "income") {
      await api.updateIncome(column.id, { ...column.item, amount: Number(value), active: true });
    } else {
      await api.updateExpense(column.id, { ...column.item, amount: Number(value), active: true });
    }
    refresh();
  }

  async function handleCellChange(month, column, rawValue) {
    const value = Number(rawValue || 0);
    setLogs(prev => ({ ...prev, [month]: { ...(prev[month] || {}), [column.key]: value } }));
    if (month === currentKey) {
      await updateCurrentMonthBackend(column, value);
    }
  }

  function noteKey(month, columnKey) {
    return `${month}|${columnKey}`;
  }

  return (
    <section className="card monthly-logs-card wide-full">
      <div className="list-header monthly-logs-header">
        <div>
          <h2>Monthly Logs</h2>
          <p className="muted">Editable January–December income and expense log. Current month edits sync back to the Income and Expense tabs.</p>
        </div>
        <div className="year-selector year-dropdown" ref={yearDropdownRef}>
          <label id="monthly-log-year-label">Year</label>
          <button
            className="year-dropdown-button"
            type="button"
            aria-labelledby="monthly-log-year-label"
            aria-expanded={yearMenuOpen}
            onClick={() => setYearMenuOpen(open => !open)}
          >
            <span>{selectedYear}</span>
            <span aria-hidden="true">⌄</span>
          </button>
          {yearMenuOpen && (
            <div className="year-dropdown-menu" ref={yearListRef} role="listbox" aria-label="Select monthly log year">
              {availableYears().map(year => (
                <button
                  key={year}
                  type="button"
                  className={year === selectedYear ? "selected" : ""}
                  role="option"
                  aria-selected={year === selectedYear}
                  onClick={() => {
                    setSelectedYear(year);
                    setYearMenuOpen(false);
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="monthly-log-wrap">
        <table className="monthly-log-table">
          <thead>
            <tr>
              <th className="sticky-col">Month</th>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
              <th className="log-total-expense">Total Expense</th>
              <th className="log-income">Total Income</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {months.map(month => {
              const totals = getTotals(month);
              return (
                <tr key={month}>
                  <td className="sticky-col month-cell">{monthLabel(month)}</td>
                  {columns.map(col => {
                    const key = noteKey(month, col.key);
                    return (
                      <td key={col.key} className={valueClass(col.type, getValue(month, col))}>
                        <div className="log-cell-wrap">
                          <input
                            type="number"
                            value={getValue(month, col)}
                            onChange={e => handleCellChange(month, col, e.target.value)}
                          />
                          <button className="note-button" type="button" title="Add note" onClick={() => setNoteCell(noteCell === key ? null : key)}>
                            {notes[key] ? "📝" : "+"}
                          </button>
                        </div>
                        {noteCell === key && (
                          <textarea
                            className="cell-note"
                            placeholder="Add note"
                            value={notes[key] || ""}
                            onChange={e => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="log-total-expense">{currency(totals.totalExpense)}</td>
                  <td className="log-income">{currency(totals.totalIncome)}</td>
                  <td className={valueClass("balance", totals.balance)}>{currency(totals.balance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
