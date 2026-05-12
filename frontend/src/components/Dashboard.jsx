import React, { useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#dc2626", "#7c3aed", "#0891b2", "#ca8a04", "#db2777", "#475569", "#65a30d"];

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function monthDayDiff(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return "Select a valid end date";
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  let anchor = new Date(s);
  anchor.setMonth(anchor.getMonth() + months);
  if (anchor > e) {
    months -= 1;
    anchor = new Date(s);
    anchor.setMonth(anchor.getMonth() + months);
  }
  const days = Math.round((e - anchor) / (1000 * 60 * 60 * 24));
  return `${months} months ${days} days`;
}

function monthsToFriendly(monthCount) {
  if (!Number.isFinite(monthCount) || monthCount <= 0) return "Not possible with current surplus";
  const wholeMonths = Math.floor(monthCount);
  const days = Math.round((monthCount - wholeMonths) * 30.4375);
  return `${wholeMonths} months ${days} days`;
}

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function Dashboard({ summary, expenses = [], assets = [] }) {
  const today = toISODate(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("2026-10-01");

  const s = summary?.summary || {
    monthly_income: 0,
    monthly_expenses: 0,
    monthly_surplus: 0,
    target_net_worth: 0,
    gap: 0,
  };

  const chartData = useMemo(() => Object.values(
    expenses.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      acc[category] = acc[category] || { name: category, value: 0 };
      acc[category].value += Number(item.amount || 0);
      return acc;
    }, {})
  ), [expenses]);

  const timeline = monthDayDiff(startDate, endDate);
  const timelineCalc = useMemo(() => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    const valid = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start;
    const days = valid ? Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) : 1;
    const months = days / 30.4375;
    const requiredMonthlyContribution = Math.ceil((s.gap || 0) / months);
    const requiredIncome = requiredMonthlyContribution + Number(s.monthly_expenses || 0);
    const currentSurplus = Number(s.monthly_surplus || 0);
    const realisticMonths = currentSurplus > 0 ? (s.gap || 0) / currentSurplus : Infinity;
    return {
      requiredMonthlyContribution,
      requiredIncome,
      realisticTimeline: monthsToFriendly(realisticMonths),
      isShort: currentSurplus < requiredMonthlyContribution,
    };
  }, [startDate, endDate, s.gap, s.monthly_expenses, s.monthly_surplus]);

  if (!summary) return <div className="card">Loading dashboard data...</div>;

  return (
    <section className="grid dashboard-grid">
      <div className="card metric"><span>Monthly Income</span><strong>{currency(s.monthly_income)}</strong></div>
      <div className="card metric"><span>Monthly Expenses</span><strong>{currency(s.monthly_expenses)}</strong></div>
      <div className="card metric"><span>Monthly Surplus</span><strong>{currency(s.monthly_surplus)}</strong></div>
      <div className="card metric"><span>Goal Amount</span><strong>{currency(s.target_net_worth)}</strong></div>
      <div className="card metric"><span>Goal Timeline</span><strong>{timeline}</strong></div>

      <div className="card wide-full timeline-card">
        <div className="section-heading">
          <div>
            <h2>Goal Timeline Planner</h2>
            <p className="muted">Set your start and end date. The planner compares your current surplus with the monthly contribution needed.</p>
          </div>
          <div className="timeline-pill">Target gap: {currency(s.gap)}</div>
        </div>

        <div className="timeline-panel">
          <label>Start date<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          <label>Target end date<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
          <div className="mini-stat"><span>Selected Timeline</span><strong>{timeline}</strong></div>
          <div className="mini-stat"><span>Required Monthly Contribution</span><strong>{currency(timelineCalc.requiredMonthlyContribution)}</strong></div>
          <div className="mini-stat"><span>Current Monthly Surplus</span><strong>{currency(s.monthly_surplus)}</strong></div>
        </div>

        <div className={timelineCalc.isShort ? "note warning-note" : "note success-note"}>
          <strong>Note:</strong>{" "}
          {timelineCalc.isShort ? (
            <>Your selected timeline is <strong>{timeline}</strong>. With your current income and expenses, this timeline is aggressive. At your current monthly income and surplus, the estimated realistic completion timeline is <strong>{timelineCalc.realisticTimeline}</strong>. This realistic timeline changes only when your income, expenses, surplus, assets, or goals change. To hit your selected timeline, your required monthly income should be approximately <strong>{currency(timelineCalc.requiredIncome)}</strong>, assuming expenses stay around <strong>{currency(s.monthly_expenses)}</strong>.</>
          ) : (
            <>Your current surplus can support this target timeline. Keep tracking expenses monthly so the forecast stays accurate.</>
          )}
        </div>
      </div>

      <div className="dashboard-charts wide-full">
        <div className="card">
          <h2>Expense Breakdown</h2>
          <div className="chart compact-chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={105} label>
                  {chartData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => currency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2>Assets vs Goals</h2>
          <div className="chart compact-chart">
            <ResponsiveContainer>
              <BarChart data={assets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => currency(value)} />
                <Legend />
                <Bar dataKey="balance" name="Current" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
