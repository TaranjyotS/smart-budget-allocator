import React, { useMemo, useState } from "react";
import { api } from "../api/client";

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

export default function IncomeStreams({ income, refresh }) {
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly" });
  const [sortField, setSortField] = useState("amount");
  const [sortDirection, setSortDirection] = useState("desc");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", amount: "", frequency: "monthly" });

  async function addIncome(e) {
    e.preventDefault();
    await api.addIncome({ ...form, amount: Number(form.amount) });
    setForm({ name: "", amount: "", frequency: "monthly" });
    refresh();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({ name: item.name || "", amount: item.amount ?? "", frequency: item.frequency || "monthly" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", amount: "", frequency: "monthly" });
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
    <section className="card">
      <div className="list-header">
        <div>
          <h2>Income Streams</h2>
          <p className="muted">Add income sources and filter by monthly, yearly, bi-weekly, weekly, or one-time income.</p>
        </div>
        <div className="total-badge"><span>Current monthly income</span><strong>{currency(displayedMonthlyTotal)}</strong></div>
      </div>
      <form className="form" onSubmit={addIncome}>
        <input placeholder="Income name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
          <option value="monthly">monthly</option>
          <option value="weekly">weekly</option>
          <option value="biweekly">biweekly</option>
          <option value="yearly">yearly</option>
          <option value="one-time">one-time</option>
        </select>
        <button>Add Income</button>
      </form>

      <div className="filters">
        <select value={frequencyFilter} onChange={e => setFrequencyFilter(e.target.value)}>
          <option value="all">All frequencies</option>
          <option value="monthly">Monthly only</option>
          <option value="biweekly">Bi-weekly only</option>
          <option value="yearly">Yearly only</option>
          <option value="weekly">Weekly only</option>
          <option value="one-time">One-time only</option>
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
                    <option value="monthly">monthly</option>
                    <option value="weekly">weekly</option>
                    <option value="biweekly">biweekly</option>
                    <option value="yearly">yearly</option>
                    <option value="one-time">one-time</option>
                  </select>
                ) : item.frequency}</td>
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
