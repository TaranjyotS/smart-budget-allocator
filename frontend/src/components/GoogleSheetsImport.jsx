import React, { useEffect, useState } from "react";
import { api } from "../api/client";

export default function GoogleSheetsImport({ refresh }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.googleStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  async function uploadCsv(e) {
    e.preventDefault();
    if (!file) return;
    const result = await api.importCsv(file);
    setMessage(`Imported ${result.income} income rows and ${result.expenses} expense rows. Skipped ${result.skipped}. Parsed automatically from your sheet headers and row text.`);
    refresh();
  }

  async function syncSheets() {
    try {
      const result = await api.googleSync();
      setMessage(`Google Sheets sync complete. Imported ${result.imported} rows using flexible auto-mapping.`);
      refresh();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="card">
      <h2>Google Sheets Import & Sync</h2>
      <p className="muted">
        Import your existing Google Sheet/CSV without being forced into fixed columns. The system looks for likely amount, name, category, frequency, due-date, income, expense, and membership fields automatically.
      </p>

      <form className="form" onSubmit={uploadCsv}>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
        <button>Import Flexible CSV</button>
      </form>

      <div className="status">
        <p><strong>Google Sheets API Enabled:</strong> {status?.enabled ? "Yes" : "No"}</p>
        <p><strong>Sheet ID Configured:</strong> {status?.sheet_id_configured ? "Yes" : "No"}</p>
        <p><strong>Range:</strong> {status?.range || "Not configured"}</p>
        <button onClick={syncSheets}>Sync Google Sheet</button>
      </div>

      {message && <div className="success">{message}</div>}

      <h3>Flexible Import Rules</h3>
      <ul className="muted">
        <li>No fixed CSV column order is required.</li>
        <li>Columns like Amount, Cost, Price, Income, Expense, Category, Due Date, Frequency, Notes are detected automatically.</li>
        <li>Rows containing salary, pay, bonus, income, deposit, or revenue are treated as income.</li>
        <li>Rows containing membership/subscription are grouped into Monthly Memberships or Yearly Memberships based on frequency/date hints.</li>
      </ul>
    </section>
  );
}
