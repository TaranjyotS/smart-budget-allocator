import React, { useMemo, useState } from "react";
import { api } from "../api/client";

export const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-time", label: "One-time" },
];

export function frequencyLabel(value) {
  return FREQUENCIES.find(item => item.value === value)?.label || value || "Monthly";
}

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

export default function IncomeStreams({ income, refresh }) {
  const [form, setForm] = useState({ name: "", amount: "", frequency: "bi-weekly" });
  const [sortField, setSortField] = useState("amount");
  const [sortDirection, setSortDirection] = useState("desc");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", amount: "", frequency: "bi-weekly" });

  async function addIncome(e) {
    e.preventDefault();
    await api.addIncome({ ...form, amount: Number(form.amount) });
    setForm({ name: "", amount: "", frequency: "bi-weekly" });
    refresh();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({ name: item.name || "", amount: item.amount ?? "", frequency: item.frequency || "bi-weekly" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", amount: "", frequency: "bi-weekly" });
  }

  async function saveEdit(id) {
    await api.updateIncome(id, { ...editForm, amount: Number(editForm.amount), active: true });
    cancelEdit();
    refresh();
  }

  const visibleIncome = useMemo(() => {
    return [...income]
      .filter(item => frequencyFilter === "all" || item.frequency === frequencyFilter)
      .sort((a, b) => {
        const aVal = sortField === "amount" ? Number(a.amount) : String(a[sortField] || "");
        const bVal = sortField === "amount" ? Number(b.amount) : String(b[sortField] || "");
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [income, sortField, sortDirection, frequencyFilter]);

  const displayedMonthlyTotal = useMemo(
    () => visibleIncome.reduce((sum, item) => sum + monthlyValue(item.amount, item.frequency), 0),
    [visibleIncome]
  );

  return (
    <section className="card income-streams-card">
      <div className="list-header">
        <div>
          <h2>Income Streams</h2>
          <p className="muted">Add income sources and filter by Monthly, Yearly, Bi-weekly, Weekly, or One-time income.</p>
        </div>
        <div className="total-badge"><span>Current monthly income</span><strong>{currency(displayedMonthlyTotal)}</strong></div>
      </div>
      <form className="form" onSubmit={addIncome}>
        <input placeholder="Income name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
          {FREQUENCIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button>Add Income</button>
      </form>

      <div className="filters">
        <select value={frequencyFilter} onChange={e => setFrequencyFilter(e.target.value)}>
          <option value="all">All frequencies</option>
          {FREQUENCIES.map(option => <option key={option.value} value={option.value}>{option.label} only</option>)}
        </select>
        <select value={sortField} onChange={e => setSortField(e.target.value)}>
          <option value="amount">Sort by amount</option>
          <option value="frequency">Sort by frequency</option>
          <option value="name">Sort by name</option>
        </select>
        <select value={sortDirection} onChange={e => setSortDirection(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <table>
        <thead><tr><th>Name</th><th>Amount</th><th>Frequency</th><th>Actions</th></tr></thead>
        <tbody>
          {visibleIncome.map(item => {
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id}>
                <td>{isEditing ? <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /> : item.name}</td>
                <td>{isEditing ? <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} /> : currency(item.amount)}</td>
                <td>{isEditing ? (
                  <select value={editForm.frequency} onChange={e => setEditForm({ ...editForm, frequency: e.target.value })}>
                    {FREQUENCIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : frequencyLabel(item.frequency)}</td>
                <td>
                  {isEditing ? (
                    <div className="action-buttons">
                      <button className="success-button" type="button" onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="secondary" type="button" onClick={cancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div className="action-buttons">
                      <button className="edit-button" type="button" onClick={() => startEdit(item)}>Edit</button>
                      <button className="danger" type="button" onClick={async () => { await api.deleteIncome(item.id); refresh(); }}>Delete</button>
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
