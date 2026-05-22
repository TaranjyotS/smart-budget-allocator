import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { FREQUENCIES, frequencyLabel } from "./IncomeStreams";

const CATEGORY_OPTIONS = [
  "Fixed Expenses",
  "Non-Fixed Expenses",
  "Monthly Memberships",
  "Yearly Memberships",
  "Investments",
  "Savings",
  "Other",
];

const EXPENSE_SUGGESTIONS = [
  "Groceries",
  "Dining Out",
  "Shopping",
  "Trips",
  "Gym Trainer",
  "Car Gas",
  "Miscellaneous",
  "Medical",
  "Phone Bill",
  "Car Insurance",
  "Rent",
  "Utilities",
  "ChatGPT",
  "Costco",
  "TFSA Contribution",
  "FHSA Contribution",
  "RRSP Contribution",
  "Wealthsimple Investment",
];

function monthlyValue(amount, frequency) {
  const normalized = String(frequency || "monthly").toLowerCase().replace("-", "");
  const value = Number(amount || 0);
  if (normalized === "weekly") return value * 52 / 12;
  if (normalized === "biweekly") return value;
  if (normalized === "yearly") return value / 12;
  return value;
}

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function Expenses({ expenses, refresh }) {
  const [form, setForm] = useState({ name: "", category: "Non-Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });
  const [sortField, setSortField] = useState("amount");
  const [sortDirection, setSortDirection] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", category: "Non-Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });
  const [targetNonFixedExpense, setTargetNonFixedExpense] = useState(() => localStorage.getItem("targetNonFixedExpense") || "1200");

  useEffect(() => {
    localStorage.setItem("targetNonFixedExpense", targetNonFixedExpense || "0");
  }, [targetNonFixedExpense]);

  async function addExpense(e) {
    e.preventDefault();
    await api.addExpense({ ...form, amount: Number(form.amount) });
    setForm({ name: "", category: "Non-Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });
    refresh();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({
      name: item.name || "",
      category: item.category || "Non-Fixed Expenses",
      amount: item.amount ?? "",
      frequency: item.frequency || "monthly",
      due_date: item.due_date || "",
      notes: item.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", category: "Non-Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });
  }

  async function saveEdit(id) {
    await api.updateExpense(id, { ...editForm, amount: Number(editForm.amount), active: true });
    cancelEdit();
    refresh();
  }

  const visibleExpenses = useMemo(() => {
    return [...expenses]
      .filter(item => categoryFilter === "all" || item.category === categoryFilter)
      .filter(item => frequencyFilter === "all" || item.frequency === frequencyFilter)
      .sort((a, b) => {
        const aVal = sortField === "amount" ? Number(a.amount) : String(a[sortField] || "");
        const bVal = sortField === "amount" ? Number(b.amount) : String(b[sortField] || "");
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [expenses, sortField, sortDirection, categoryFilter, frequencyFilter]);

  const categories = Array.from(new Set([...CATEGORY_OPTIONS, ...expenses.map(e => e.category)])).filter(Boolean);

  const displayedMonthlyTotal = useMemo(
    () => visibleExpenses.reduce((sum, item) => sum + monthlyValue(item.amount, item.frequency), 0),
    [visibleExpenses]
  );

  const targetFixedExpense = useMemo(() => {
    return expenses
      .filter(item => ["Fixed Expenses", "Monthly Memberships", "Yearly Memberships"].includes(item.category))
      .reduce((sum, item) => sum + monthlyValue(item.amount, item.frequency), 0);
  }, [expenses]);

  const currentNonFixedExpense = useMemo(() => {
    return expenses
      .filter(item => item.category === "Non-Fixed Expenses")
      .reduce((sum, item) => sum + monthlyValue(item.amount, item.frequency), 0);
  }, [expenses]);

  const targetNonFixedValue = Number(targetNonFixedExpense || 0);
  const isNonFixedAtOrOverTarget = currentNonFixedExpense > 0 && currentNonFixedExpense >= targetNonFixedValue;

  function nextCategoryChange(category, sourceForm) {
    return {
      ...sourceForm,
      category,
      frequency: category === "Yearly Memberships" ? "yearly" : category === "Monthly Memberships" ? "monthly" : sourceForm.frequency,
    };
  }

  return (
    <section className="card">
      <datalist id="expense-name-suggestions">
        {EXPENSE_SUGGESTIONS.map(item => <option key={item} value={item} />)}
      </datalist>
      <div className="list-header">
        <div>
          <h2>Expense Tracker</h2>
          <p className="muted">Non-fixed expenses reset at the start of each month and should be added as they occur.</p>
        </div>
        <div className="total-badge expense-total-badge">
          <span>Current monthly expense</span>
          <strong>{currency(displayedMonthlyTotal)}</strong>
          <small>Target fixed: {currency(targetFixedExpense)}</small>
          <label className="target-input-label">
            <span>Target non-fixed:</span>
            <span className="target-money-field">
              <span className="money-prefix">$</span>
              <input
                type="number"
                value={targetNonFixedExpense}
                onChange={e => setTargetNonFixedExpense(e.target.value)}
                aria-label="Target non-fixed expense"
              />
            </span>
          </label>
          <p className={`target-warning ${isNonFixedAtOrOverTarget ? "visible" : "hidden"}`}>
            * Non-fixed expenses have reached or exceeded your monthly target.
          </p>
        </div>
      </div>

      <form className="form form-wide" onSubmit={addExpense}>
        <input list="expense-name-suggestions" placeholder={form.category.includes("Membership") ? "Membership name, e.g. ChatGPT" : "Expense name"} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <select value={form.category} onChange={e => setForm(nextCategoryChange(e.target.value, form))}>
          {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
          {FREQUENCIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input placeholder="Due date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
        <input placeholder="Notes / membership details" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button>Add Expense</button>
      </form>

      <div className="filters">
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map(category => <option key={category} value={category}>{category}</option>)}
        </select>
        <select value={frequencyFilter} onChange={e => setFrequencyFilter(e.target.value)}>
          <option value="all">All frequencies</option>
          {FREQUENCIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select value={sortField} onChange={e => setSortField(e.target.value)}>
          <option value="amount">Sort by amount</option>
          <option value="frequency">Sort by frequency</option>
          <option value="category">Sort by category</option>
          <option value="name">Sort by name</option>
        </select>
        <select value={sortDirection} onChange={e => setSortDirection(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <table>
        <thead><tr><th>Name</th><th>Category</th><th>Amount</th><th>Frequency</th><th>Due</th><th>Notes</th><th>Actions</th></tr></thead>
        <tbody>
          {visibleExpenses.map(item => {
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id}>
                <td>{isEditing ? <input list="expense-name-suggestions" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /> : item.name}</td>
                <td>{isEditing ? (
                  <select value={editForm.category} onChange={e => setEditForm(nextCategoryChange(e.target.value, editForm))}>
                    {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : <span className={`pill ${item.category?.toLowerCase().replaceAll(" ", "-")}`}>{item.category}</span>}</td>
                <td>{isEditing ? <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} /> : currency(item.amount)}</td>
                <td>{isEditing ? (
                  <select value={editForm.frequency} onChange={e => setEditForm({ ...editForm, frequency: e.target.value })}>
                    {FREQUENCIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : frequencyLabel(item.frequency)}</td>
                <td>{isEditing ? <input value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} /> : item.due_date}</td>
                <td>{isEditing ? <input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /> : item.notes}</td>
                <td>
                  {isEditing ? (
                    <div className="action-buttons">
                      <button className="success-button" type="button" onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="secondary" type="button" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div className="action-buttons">
                      <button className="edit-button" type="button" onClick={() => startEdit(item)}>Edit</button>
                      <button className="danger" type="button" onClick={async () => { await api.deleteExpense(item.id); refresh(); }}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
