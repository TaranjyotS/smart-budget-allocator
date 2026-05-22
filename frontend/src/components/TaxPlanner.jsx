import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PROVINCE_TAX = {
  Ontario: [
    [53891, 0.0505],
    [107785, 0.0915],
    [150000, 0.1116],
    [220000, 0.1216],
    [Infinity, 0.1316],
  ],
  Alberta: [
    [151234, 0.10],
    [181481, 0.12],
    [241974, 0.13],
    [362961, 0.14],
    [Infinity, 0.15],
  ],
  "British Columbia": [
    [49279, 0.0506],
    [98560, 0.077],
    [113158, 0.105],
    [137407, 0.1229],
    [186306, 0.147],
    [259829, 0.168],
    [Infinity, 0.205],
  ],
  Manitoba: [
    [48216, 0.108],
    [103566, 0.1275],
    [Infinity, 0.174],
  ],
  Saskatchewan: [
    [53463, 0.105],
    [152750, 0.125],
    [Infinity, 0.145],
  ],
  Quebec: [
    [54345, 0.14],
    [108680, 0.19],
    [132245, 0.24],
    [Infinity, 0.2575],
  ],
  "Nova Scotia": [
    [30507, 0.0879],
    [61015, 0.1495],
    [95883, 0.1667],
    [154650, 0.175],
    [Infinity, 0.21],
  ],
  "New Brunswick": [
    [51306, 0.094],
    [102614, 0.14],
    [190060, 0.16],
    [Infinity, 0.195],
  ],
  "Newfoundland and Labrador": [
    [44192, 0.087],
    [88382, 0.145],
    [157792, 0.158],
    [220910, 0.178],
    [282214, 0.198],
    [564429, 0.208],
    [1128858, 0.213],
    [Infinity, 0.218],
  ],
  "Prince Edward Island": [
    [33328, 0.0965],
    [64656, 0.1363],
    [105000, 0.1665],
    [140000, 0.18],
    [Infinity, 0.1875],
  ],
};

const FEDERAL_TAX = [
  [57375, 0.14],
  [114750, 0.205],
  [177882, 0.26],
  [253414, 0.29],
  [Infinity, 0.33],
];

const ACCOUNT_LIMITS_2026 = {
  tfsaAnnual: 7000,
  fhsaAnnual: 8000,
  fhsaLifetime: 40000,
  rrspDollarLimit: 33810,
};

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function calculateBracketTax(income, brackets) {
  let tax = 0;
  let previous = 0;
  for (const [limit, rate] of brackets) {
    const taxableAtBracket = Math.max(0, Math.min(income, limit) - previous);
    tax += taxableAtBracket * rate;
    if (income <= limit) break;
    previous = limit;
  }
  return tax;
}

function durationToMonths(durationValue, durationUnit) {
  const value = Math.max(0, Number(durationValue || 0));
  if (!value) return 12;
  if (durationUnit === "days") return value / 30.4375;
  if (durationUnit === "weeks") return value / 4.345;
  if (durationUnit === "months") return value;
  if (durationUnit === "years") return value * 12;
  return 12;
}

function normalizeIncomeAmount(amount, frequency, durationValue = 12, durationUnit = "months") {
  const value = Number(amount || 0);
  const months = durationToMonths(durationValue, durationUnit);
  if (frequency === "hourly") return value * 40 * (months / 12) * 52;
  if (frequency === "weekly") return value * (months / 12) * 52;
  if (frequency === "bi-weekly") return value * (months / 12) * 26;
  if (frequency === "monthly") return value * months;
  if (frequency === "yearly") return value * (months / 12);
  return value;
}

function formatDuration(value, unit) {
  const label = String(unit || "months").charAt(0).toUpperCase() + String(unit || "months").slice(1);
  return `${Number(value || 0)} ${label}`;
}

function frequencyLabel(value) {
  const map = { hourly: "Hourly", weekly: "Weekly", "bi-weekly": "Bi-weekly", monthly: "Monthly", yearly: "Yearly", "one-time": "One-time" };
  return map[value] || value;
}

function marginalRate(income, province) {
  const fed = FEDERAL_TAX.find(([limit]) => income <= limit)?.[1] || 0.33;
  const prov = (PROVINCE_TAX[province] || PROVINCE_TAX.Ontario).find(([limit]) => income <= limit)?.[1] || 0.1316;
  return fed + prov;
}

function employmentCost(annualIncome, type) {
  if (type === "t4") {
    const cpp = Math.min(Math.max(annualIncome - 3500, 0) * 0.0595, 4034.10);
    const ei = Math.min(annualIncome * 0.0164, 1077.48);
    return { cpp, ei, label: "CPP + EI" };
  }
  if (type === "contractor-unincorporated" || type === "business") {
    const cpp = Math.min(Math.max(annualIncome - 3500, 0) * 0.119, 8068.20);
    return { cpp, ei: 0, label: "CPP, self-employed estimate" };
  }
  return { cpp: 0, ei: 0, label: "Corporate/personal split estimate" };
}

export default function TaxPlanner({ expenses = [] }) {
  const [incomeSources, setIncomeSources] = useState([
    { id: 1, name: "Main income", amount: 55000, frequency: "yearly", type: "t4", durationValue: 12, durationUnit: "months", province: "Ontario" },
  ]);
  const [newIncome, setNewIncome] = useState({ name: "", amount: "", frequency: "yearly", type: "t4", durationValue: 12, durationUnit: "months", province: "Ontario" });
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editIncome, setEditIncome] = useState({ name: "", amount: "", frequency: "yearly", type: "t4", durationValue: 12, durationUnit: "months", province: "Ontario" });
  const [rooms, setRooms] = useState({ tfsa: 36000, fhsa: 8000, rrsp: 12000 });
  const [contribs, setContribs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("registeredAccountContributions") || "null") || { tfsa: 0, fhsa: 0, rrsp: 0 };
    } catch {
      return { tfsa: 0, fhsa: 0, rrsp: 0 };
    }
  });
  const [chartPeriod, setChartPeriod] = useState("yearly");

  useEffect(() => {
    localStorage.setItem("registeredAccountContributions", JSON.stringify(contribs));
  }, [contribs]);

  const expenseContribs = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const text = `${expense.name || ""} ${expense.category || ""} ${expense.notes || ""}`.toLowerCase();
      const amount = Number(expense.amount || 0);
      if (text.includes("tfsa")) acc.tfsa += amount;
      if (text.includes("fhsa")) acc.fhsa += amount;
      if (text.includes("rrsp")) acc.rrsp += amount;
      return acc;
    }, { tfsa: 0, fhsa: 0, rrsp: 0 });
  }, [expenses]);

  const totalContribs = useMemo(() => ({
    tfsa: Number(contribs.tfsa || 0) + Number(expenseContribs.tfsa || 0),
    fhsa: Number(contribs.fhsa || 0) + Number(expenseContribs.fhsa || 0),
    rrsp: Number(contribs.rrsp || 0) + Number(expenseContribs.rrsp || 0),
  }), [contribs, expenseContribs]);

  const tax = useMemo(() => {
    const annualIncome = incomeSources.reduce((sum, item) => sum + normalizeIncomeAmount(item.amount, item.frequency, item.durationValue, item.durationUnit), 0);
    const rrspDeduction = Math.min(Number(totalContribs.rrsp || 0), Number(rooms.rrsp || 0), ACCOUNT_LIMITS_2026.rrspDollarLimit);
    const fhsaDeduction = Math.min(Number(totalContribs.fhsa || 0), Number(rooms.fhsa || 0), ACCOUNT_LIMITS_2026.fhsaAnnual);
    const taxableIncome = Math.max(0, annualIncome - rrspDeduction - fhsaDeduction);
    const federalTax = calculateBracketTax(taxableIncome, FEDERAL_TAX);
    const provincialTax = incomeSources.reduce((sum, item) => {
      const sourceAnnual = normalizeIncomeAmount(item.amount, item.frequency, item.durationValue, item.durationUnit);
      const sourceShare = annualIncome > 0 ? sourceAnnual / annualIncome : 0;
      const sourceTaxableIncome = taxableIncome * sourceShare;
      return sum + calculateBracketTax(sourceTaxableIncome, PROVINCE_TAX[item.province] || PROVINCE_TAX.Ontario);
    }, 0);
    const payroll = incomeSources.reduce((acc, item) => {
      const annual = normalizeIncomeAmount(item.amount, item.frequency, item.durationValue, item.durationUnit);
      const c = employmentCost(annual, item.type);
      acc.cpp += c.cpp;
      acc.ei += c.ei;
      return acc;
    }, { cpp: 0, ei: 0 });
    const totalTax = federalTax + provincialTax + payroll.cpp + payroll.ei;
    const netAnnual = Math.max(0, annualIncome - totalTax - Number(totalContribs.tfsa || 0) - Number(totalContribs.rrsp || 0) - Number(totalContribs.fhsa || 0));
    const primaryProvince = incomeSources[0]?.province || "Ontario";
    const rate = marginalRate(annualIncome, primaryProvince);
    const rrspSavings = rrspDeduction * rate;
    const fhsaSavings = fhsaDeduction * rate;
    const tfsaLeft = Math.max(0, Number(rooms.tfsa || 0) - Number(totalContribs.tfsa || 0));
    const fhsaLeft = Math.max(0, Number(rooms.fhsa || 0) - Number(totalContribs.fhsa || 0));
    const rrspLeft = Math.max(0, Number(rooms.rrsp || 0) - Number(totalContribs.rrsp || 0));
    return { annualIncome, taxableIncome, federalTax, provincialTax, totalTax, payroll, netAnnual, rate, rrspSavings, fhsaSavings, tfsaLeft, fhsaLeft, rrspLeft };
  }, [incomeSources, rooms, totalContribs]);

  const periodDivisor = chartPeriod === "monthly" ? 12 : chartPeriod === "bi-weekly" ? 26 : 1;
  const chartData = [
    { name: "Federal tax", value: Math.round(tax.federalTax / periodDivisor) },
    { name: "Provincial tax", value: Math.round(tax.provincialTax / periodDivisor) },
    { name: "CPP/EI", value: Math.round((tax.payroll.cpp + tax.payroll.ei) / periodDivisor) },
    { name: "Estimated net", value: Math.round(tax.netAnnual / periodDivisor) },
  ];

  const addIncome = () => {
    if (!newIncome.name || !newIncome.amount) return;
    setIncomeSources([...incomeSources, { ...newIncome, id: Date.now(), amount: Number(newIncome.amount), durationValue: Number(newIncome.durationValue || 12) }]);
    setNewIncome({ name: "", amount: "", frequency: "yearly", type: "t4", durationValue: 12, durationUnit: "months", province: "Ontario" });
  };

  const startIncomeEdit = (item) => {
    setEditingIncomeId(item.id);
    setEditIncome({
      name: item.name || "",
      amount: item.amount ?? "",
      frequency: item.frequency || "yearly",
      type: item.type || "t4",
      durationValue: item.durationValue ?? 12,
      durationUnit: item.durationUnit || "months",
      province: item.province || "Ontario",
    });
  };

  const cancelIncomeEdit = () => {
    setEditingIncomeId(null);
    setEditIncome({ name: "", amount: "", frequency: "yearly", type: "t4", durationValue: 12, durationUnit: "months", province: "Ontario" });
  };

  const saveIncomeEdit = (id) => {
    setIncomeSources(incomeSources.map(item => item.id === id
      ? { ...item, ...editIncome, amount: Number(editIncome.amount), durationValue: Number(editIncome.durationValue || 12) }
      : item
    ));
    cancelIncomeEdit();
  };

  const priority = useMemo(() => {
    const items = [];
    if (Number(rooms.fhsa || 0) > Number(totalContribs.fhsa || 0)) items.push("FHSA: strong priority if you are eligible and planning to buy a first home in Canada.");
    if (Number(rooms.rrsp || 0) > Number(totalContribs.rrsp || 0)) items.push("RRSP: useful when your income is high enough that the deduction meaningfully lowers taxes.");
    if (Number(rooms.tfsa || 0) > Number(totalContribs.tfsa || 0)) items.push("TFSA: flexible tax-free investing and usually best for long-term growth after emergency savings.");
    if (!items.length) items.push("All entered contribution rooms appear fully used. Review CRA My Account before adding more.");
    return items;
  }, [rooms, totalContribs]);

  return (
    <section className="tax-layout">
      <div className="card wide-full tax-hero-card">
        <div className="section-heading">
          <div>
            <h2>Tax & Registered Accounts Planner</h2>
            <p className="muted tax-subtitle">Estimate Canadian income taxes, compare income types, and plan TFSA, FHSA, and RRSP contributions using your CRA-confirmed room.</p>
          </div>
          <div className="timeline-pill">2026 planning mode</div>
        </div>
        <div className="tax-disclaimer">
          <strong>Important note:</strong> This calculator provides general estimates and educational suggestions only. It does not replace professional tax, legal, accounting, or financial advice. Tax rules, contribution limits, deductions, credits, and eligibility can vary based on your personal situation. Please verify all numbers with CRA, your CRA My Account, and a qualified tax professional before making financial or tax decisions.
        </div>
      </div>

      <div className="grid dashboard-grid">
        <div className="card metric"><span>Gross Annual Income</span><strong>{currency(tax.annualIncome)}</strong></div>
        <div className="card metric"><span>Estimated Annual Tax</span><strong>{currency(tax.totalTax)}</strong><em className="metric-detail"><span>Federal {currency(tax.federalTax)}</span><span>Provincial {currency(tax.provincialTax)}</span></em></div>
        <div className="card metric"><span>Net Monthly Income</span><strong>{currency(tax.netAnnual / 12)}</strong></div>
        <div className="card metric"><span>RRSP/FHSA Tax Savings</span><strong>{currency(tax.rrspSavings + tax.fhsaSavings)}</strong></div>
        <div className="card metric"><span>Marginal Rate Estimate</span><strong>{Math.round(tax.rate * 1000) / 10}%</strong></div>
      </div>

      <div className="card wide-full tax-income-card">
        <div className="list-header">
          <div>
            <h2>Income Sources</h2>
            <p className="muted">Add T4, contractor, incorporated contractor, business, or multiple jobs. Choose the pay basis, duration, and province for each income source.</p>
          </div>
        </div>

        <div className="form tax-form">
          <input placeholder="Income name" value={newIncome.name} onChange={e => setNewIncome({ ...newIncome, name: e.target.value })} />
          <input type="number" placeholder="Amount" value={newIncome.amount} onChange={e => setNewIncome({ ...newIncome, amount: e.target.value })} />
          <select value={newIncome.frequency} onChange={e => setNewIncome({ ...newIncome, frequency: e.target.value })}>
            <option value="hourly">Hourly</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One-time</option>
          </select>
          <input type="number" placeholder="Duration" value={newIncome.durationValue} onChange={e => setNewIncome({ ...newIncome, durationValue: e.target.value })} />
          <select value={newIncome.durationUnit} onChange={e => setNewIncome({ ...newIncome, durationUnit: e.target.value })}>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
          <select value={newIncome.province} onChange={e => setNewIncome({ ...newIncome, province: e.target.value })}>
            {Object.keys(PROVINCE_TAX).map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={newIncome.type} onChange={e => setNewIncome({ ...newIncome, type: e.target.value })}>
            <option value="t4">T4 employee</option>
            <option value="contractor-unincorporated">Contractor, not incorporated</option>
            <option value="incorporated">Incorporated contractor</option>
            <option value="business">Business/self-employed</option>
          </select>
          <button onClick={addIncome}>Add Income</button>
        </div>

        <div className="table-wrap no-scroll-table">
          <table>
            <thead><tr><th>Name</th><th>Amount</th><th>Frequency</th><th>Duration</th><th>Province</th><th>Type</th><th></th></tr></thead>
            <tbody>
              {incomeSources.map(item => {
                const isEditing = editingIncomeId === item.id;
                return (
                  <tr key={item.id}>
                    <td>{isEditing ? <input value={editIncome.name} onChange={e => setEditIncome({ ...editIncome, name: e.target.value })} /> : item.name}</td>
                    <td>{isEditing ? <input type="number" value={editIncome.amount} onChange={e => setEditIncome({ ...editIncome, amount: e.target.value })} /> : currency(item.amount)}</td>
                    <td>{isEditing ? (
                      <select value={editIncome.frequency} onChange={e => setEditIncome({ ...editIncome, frequency: e.target.value })}>
                        <option value="hourly">Hourly</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="one-time">One-time</option>
                      </select>
                    ) : frequencyLabel(item.frequency)}</td>
                    <td>{isEditing ? (
                      <div className="inline-edit-pair">
                        <input type="number" value={editIncome.durationValue} onChange={e => setEditIncome({ ...editIncome, durationValue: e.target.value })} />
                        <select value={editIncome.durationUnit} onChange={e => setEditIncome({ ...editIncome, durationUnit: e.target.value })}>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    ) : formatDuration(item.durationValue, item.durationUnit)}</td>
                    <td>{isEditing ? (
                      <select value={editIncome.province} onChange={e => setEditIncome({ ...editIncome, province: e.target.value })}>
                        {Object.keys(PROVINCE_TAX).map(p => <option key={p}>{p}</option>)}
                      </select>
                    ) : item.province || "Ontario"}</td>
                    <td>{isEditing ? (
                      <select value={editIncome.type} onChange={e => setEditIncome({ ...editIncome, type: e.target.value })}>
                        <option value="t4">T4 employee</option>
                        <option value="contractor-unincorporated">Contractor, not incorporated</option>
                        <option value="incorporated">Incorporated contractor</option>
                        <option value="business">Business/self-employed</option>
                      </select>
                    ) : item.type}</td>
                    <td>
                      {isEditing ? (
                        <div className="action-buttons">
                          <button className="success-button" type="button" onClick={() => saveIncomeEdit(item.id)}>Save</button>
                          <button className="secondary" type="button" onClick={cancelIncomeEdit}>Cancel</button>
                        </div>
                      ) : (
                        <div className="action-buttons tax-inline-actions">
                          <button className="edit-button compact-action-button" type="button" onClick={() => startIncomeEdit(item)}>Edit</button>
                          <button className="danger compact-action-button" type="button" onClick={() => setIncomeSources(incomeSources.filter(x => x.id !== item.id))}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card wide-full tax-breakdown-card">
        <div className="section-heading">
          <div>
            <h2>Tax Estimate Breakdown</h2>
            <p className="muted">Switch between Yearly, Monthly, and Bi-weekly estimates.</p>
          </div>
          <select className="period-select" value={chartPeriod} onChange={e => setChartPeriod(e.target.value)}>
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="bi-weekly">Bi-weekly</option>
          </select>
        </div>
        <div className="chart compact-chart">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => currency(value)} />
              <Legend />
              <Bar dataKey="value" name="Amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="tax-grid-two">
        <div className="card">
          <h2>CRA Contribution Room</h2>
          <p className="muted">Enter the exact room from CRA My Account/NOA. The app also includes TFSA/FHSA/RRSP investment entries from the Expense tab.</p>
          <div className="registered-room-grid paired-room-grid">
            <label>TFSA available room<input type="number" value={rooms.tfsa} onChange={e => setRooms({ ...rooms, tfsa: Number(e.target.value) })} /></label>
            <label>Current TFSA contribution<input type="number" value={contribs.tfsa} onChange={e => setContribs({ ...contribs, tfsa: Number(e.target.value) })} /></label>
            <label>FHSA available room<input type="number" value={rooms.fhsa} onChange={e => setRooms({ ...rooms, fhsa: Number(e.target.value) })} /></label>
            <label>Current FHSA contribution<input type="number" value={contribs.fhsa} onChange={e => setContribs({ ...contribs, fhsa: Number(e.target.value) })} /></label>
            <label>RRSP deduction/contribution room<input type="number" value={rooms.rrsp} onChange={e => setRooms({ ...rooms, rrsp: Number(e.target.value) })} /></label>
            <label>Current RRSP contribution<input type="number" value={contribs.rrsp} onChange={e => setContribs({ ...contribs, rrsp: Number(e.target.value) })} /></label>
          </div>
        </div>

        <div className="card">
          <h2>Registered Account Summary</h2>
          <div className="account-room-cards account-room-pairs">
            <div className="mini-stat"><span>TFSA room left</span><strong>{currency(tax.tfsaLeft)}</strong></div>
            <div className="mini-stat"><span>TFSA estimated tax savings</span><strong>$0</strong></div>
            <div className="mini-stat"><span>FHSA room left</span><strong>{currency(tax.fhsaLeft)}</strong></div>
            <div className="mini-stat"><span>Estimated FHSA savings</span><strong>{currency(tax.fhsaSavings)}</strong></div>
            <div className="mini-stat"><span>RRSP room left</span><strong>{currency(tax.rrspLeft)}</strong></div>
            <div className="mini-stat"><span>Estimated RRSP savings</span><strong>{currency(tax.rrspSavings)}</strong></div>
          </div>
        </div>
      </div>

      <div className="card wide-full">
        <h2>Smart Suggestions</h2>
        <ul className="muted suggestion-list">
          {priority.map((item, index) => <li key={index}>{item}</li>)}
          <li>2026 reference limits used in this planner: TFSA annual dollar limit {currency(ACCOUNT_LIMITS_2026.tfsaAnnual)}, FHSA annual limit {currency(ACCOUNT_LIMITS_2026.fhsaAnnual)}, FHSA lifetime deduction limit {currency(ACCOUNT_LIMITS_2026.fhsaLifetime)}, RRSP dollar limit {currency(ACCOUNT_LIMITS_2026.rrspDollarLimit)}.</li>
          <li>For incorporated contractors, this tab gives a high-level estimate only. Salary/dividend mix, corporate tax, HST/GST, bookkeeping, payroll, and deductions should be reviewed with an accountant.</li>
          <li>Do not contribute above CRA-confirmed room. Excess contributions can create penalties.</li>
        </ul>
      </div>
    </section>
  );
}
