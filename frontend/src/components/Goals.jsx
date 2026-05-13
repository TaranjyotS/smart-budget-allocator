import React, { useState } from "react";
import { api } from "../api/client";

export default function Goals({ assets, refresh }) {
  const [editing, setEditing] = useState({});
  const [form, setForm] = useState({ name: "", balance: "", target: "", priority: "4" });

  function updateLocal(id, field, value) {
    setEditing(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  }

  async function save(asset) {
    const draft = editing[asset.id] || {};
    await api.updateAsset(asset.id, {
      name: draft.name ?? asset.name,
      balance: Number(draft.balance ?? asset.balance),
      target: Number(draft.target ?? asset.target),
      priority: Number(draft.priority ?? asset.priority),
    });
    refresh();
  }

  async function addAsset(e) {
    e.preventDefault();
    await api.addAsset({ name: form.name, balance: Number(form.balance), target: Number(form.target), priority: Number(form.priority) });
    setForm({ name: "", balance: "", target: "", priority: String(assets.length + 2) });
    refresh();
  }

  return (
    <section className="card">
      <h2>Asset Goals</h2>
      <form className="form" onSubmit={addAsset}>
        <input placeholder="New asset/goal name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="number" placeholder="Current balance" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} required />
        <input type="number" placeholder="Target amount" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} required />
        <input type="number" placeholder="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} required />
        <button>Add Asset/Goal</button>
      </form>

      <table>
        <thead><tr><th>Account</th><th>Current Balance</th><th>Target</th><th>Priority</th><th>Progress</th><th>Actions</th></tr></thead>
        <tbody>
          {assets.map(asset => {
            const current = editing[asset.id] || {};
            const balance = Number(current.balance ?? asset.balance);
            const target = Number(current.target ?? asset.target);
            const pct = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;
            return (
              <tr key={asset.id}>
                <td><input value={current.name ?? asset.name} onChange={e => updateLocal(asset.id, "name", e.target.value)} /></td>
                <td><input type="number" value={current.balance ?? asset.balance} onChange={e => updateLocal(asset.id, "balance", e.target.value)} /></td>
                <td><input type="number" value={current.target ?? asset.target} onChange={e => updateLocal(asset.id, "target", e.target.value)} /></td>
                <td><input type="number" value={current.priority ?? asset.priority} onChange={e => updateLocal(asset.id, "priority", e.target.value)} /></td>
                <td><div className="progress"><span style={{ width: `${pct}%` }}></span></div>{pct}%</td>
                <td>
                  <div className="action-buttons no-wrap-actions">
                    <button className="success-button compact-action-button" onClick={() => save(asset)}>Save</button>
                    <button className="danger compact-action-button" onClick={async () => { await api.deleteAsset(asset.id); refresh(); }}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
