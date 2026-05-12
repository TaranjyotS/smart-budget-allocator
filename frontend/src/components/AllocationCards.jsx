import React from "react";

export default function AllocationCards({ summary }) {
  if (!summary) return <div className="card">Loading...</div>;
  return (
    <section className="allocator-layout">
      <div className="card wide-full">
        <h2>Smart Allocation Recommendation</h2>
        <p>{summary.recommendation.message}</p>
      </div>
      <div className="allocation-grid">
        {summary.recommendation.allocations.map(item => (
          <div className="card metric allocation-card" key={item.account}>
            <span className="recommended-badge">Recommended</span>
            <span>{item.account}</span>
            <strong>${item.amount}</strong>
            <p className="muted">{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
