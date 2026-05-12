import React, { useMemo, useState } from "react";
import { api } from "../api/client";

const CATEGORY_OPTIONS = [
  "Fixed Expenses",
  "Non-Fixed Expenses",
  "Monthly Memberships",
  "Yearly Memberships",
  "Investments",
  "Savings",
  "Other",
];

function monthlyValue(amount, frequency) {
  const normalized = String(frequency || "monthly").toLowerCase().replace("-", "");
  const value = Number(amount || 0);
  if (normalized === "weekly") return value * 52 / 12;
  if (normalized === "biweekly") return value * 26 / 12;
  if (normalized === "yearly") return value / 12;
  return value;
}

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function Expenses({ expenses, refresh }) {
  const [form, setForm] = useState({ name: "", category: "Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });
  const [sortField, setSortField] = useState("amount");
  const [sortDirection, setSortDirection] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", category: "Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });

  async function addExpense(e) {
    e.preventDefault();
    await api.addExpense({ ...form, amount: Number(form.amount) });
    setForm({ name: "", category: "Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });
    refresh();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({
      name: item.name || "",
      category: item.category || "Fixed Expenses",
      amount: item.amount ?? "",
      frequency: item.frequency || "monthly",
      due_date: item.due_date || "",
      notes: item.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", category: "Fixed Expenses", amount: "", frequency: "monthly", due_date: "", notes: "" });
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

  const frequencyOptions = ["monthly", "weekly", "biweekly", "yearly", "one-time"];

  return (
    <section className="card">
      <div className="list-header">
        <div>
          <h2>Expense Tracker</h2>
          <p className="muted">Add fixed expenses, non-fixed expenses, monthly memberships, yearly memberships, or any future category.</p>
        </div>
        <div className="total-badge"><span>Current monthly expense</span><strong>{currency(displayedMonthlyTotal)}</strong></div>
      </div>

      <form className="form form-wide" onSubmit={addExpense}>
        <input placeholder={form.category.includes("Membership") ? "Membership name, e.g. ChatGPT" : "Expense name"} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, frequency: e.target.value === "Yearly Memberships" ? "yearly" : e.target.value === "Monthly Memberships" ? "monthly" : form.frequency })}>
          {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
          {frequencyOptions.map(option => <option key={option} value={option}>{option}</option>)}
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
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="weekly">Weekly</option>
          <option value="one-time">One-time</option>
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
                <td>{isEditing ? <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /> : item.name}</td>
                <td>{isEditing ? (
                  <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value, frequency: e.target.value === "Yearly Memberships" ? "yearly" : e.target.value === "Monthly Memberships" ? "monthly" : editForm.frequency })}>
                    {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : <span className={`pill ${item.category?.toLowerCase().replaceAll(" ", "-")}`}>{item.category}</span>}</td>
                <td>{isEditing ? <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} /> : currency(item.amount)}</td>
                <td>{isEditing ? (
                  <select value={editForm.frequency} onChange={e => setEditForm({ ...editForm, frequency: e.target.value })}>
                    {frequencyOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : item.frequency}</td>
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
