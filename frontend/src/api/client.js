const configuredApiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE;
const localApiBase = `${window.location.protocol}//${window.location.hostname}:8000`;
const API_BASE = (configuredApiBase || localApiBase).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "API request failed");
  }

  return response.json();
}

export const api = {
  getSummary: () => request("/allocations/summary"),
  getIncome: () => request("/budget/income"),
  addIncome: (data) => request("/budget/income", { method: "POST", body: JSON.stringify(data) }),
  updateIncome: (id, data) => request(`/budget/income/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteIncome: (id) => request(`/budget/income/${id}`, { method: "DELETE" }),
  getExpenses: () => request("/budget/expenses"),
  addExpense: (data) => request("/budget/expenses", { method: "POST", body: JSON.stringify(data) }),
  updateExpense: (id, data) => request(`/budget/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/budget/expenses/${id}`, { method: "DELETE" }),
  getAssets: () => request("/assets"),
  addAsset: (data) => request("/assets", { method: "POST", body: JSON.stringify(data) }),
  updateAsset: (id, data) => request(`/assets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAsset: (id) => request(`/assets/${id}`, { method: "DELETE" }),
  importCsv: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_BASE}/imports/csv`, { method: "POST", body: form });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  googleStatus: () => request("/google-sheets/status"),
  googleSync: () => request("/google-sheets/sync", { method: "POST" }),
};
