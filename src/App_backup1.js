import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed"];

function App() {
  // 🌙 Dark mode
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  // ===== STATES =====
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("expenses");
    return saved ? JSON.parse(saved) : [];
  });

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    amount: "",
    date: "",
    category: "",
  });

  // ===== DARK MODE EFFECT =====
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ===== ADD =====
  const addExpense = () => {
    if (!title || !amount || !date || !category) return;

    const finalCategory =
      category === "Other" ? customCategory : category;
    if (!finalCategory) return;

    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        title,
        amount,
        date,
        category: finalCategory,
      },
    ]);

    setTitle("");
    setAmount("");
    setCategory("");
    setCustomCategory("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  // ===== CRUD =====
  const deleteExpense = (id) =>
    setExpenses(expenses.filter((e) => e.id !== id));

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditForm({
      title: e.title,
      amount: e.amount,
      date: e.date,
      category: e.category,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", amount: "", date: "", category: "" });
  };

  const saveEdit = (id) => {
    setExpenses(
      expenses.map((e) =>
        e.id === id ? { ...e, ...editForm } : e
      )
    );
    cancelEdit();
  };

  const clearAll = () => {
    if (window.confirm("Delete all expenses permanently?")) {
      setExpenses([]);
      localStorage.removeItem("expenses");
    }
  };

  // ===== STORAGE =====
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  // ===== VIEW PIPELINE =====
  let view = selectedMonth
    ? expenses.filter(
        (e) => e.date && e.date.split("-")[1] === selectedMonth
      )
    : expenses;

  if (search.trim()) {
    const q = search.toLowerCase();
    view = view.filter((e) =>
      e.title.toLowerCase().includes(q)
    );
  }

  if (sortBy) {
    view = [...view].sort((a, b) => {
      let x, y;
      if (sortBy === "amount") {
        x = Number(a.amount);
        y = Number(b.amount);
      } else {
        x = a.date;
        y = b.date;
      }
      return sortDir === "asc" ? (x > y ? 1 : -1) : x < y ? 1 : -1;
    });
  }

  // ===== DASHBOARD DATA =====
  const totalAmount = view.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const pieData = Object.entries(
    view.reduce((acc, e) => {
      acc[e.category] =
        (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const monthMap = {};
  view.forEach((e) => {
    const m = e.date?.slice(0, 7);
    if (!m) return;
    monthMap[m] = (monthMap[m] || 0) + Number(e.amount);
  });

  const barData = Object.entries(monthMap).map(
    ([month, total]) => ({ month, total })
  );

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-gray-800 min-h-screen p-4 shadow-lg">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            Your Money
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Expense Tracker
          </p>
        </div>

        <nav className="space-y-3">
          <button className="w-full text-left px-3 py-2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            📊 Dashboard
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            🧾 Transactions
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            ➕ Incomes
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            💸 Expenses
          </button>
        </nav>

        <div className="mt-10 border-t pt-4">
          <button className="text-sm text-red-500 hover:underline">
            ⏏ Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4">
        <div className="max-w-5xl mx-auto space-y-4 text-gray-900 dark:text-gray-100">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              Expense Dashboard
            </h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 dark:text-white"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Total Spent", `₹${totalAmount}`],
              ["Transactions", view.length],
              ["Categories", pieData.length],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white dark:bg-gray-800 p-4 rounded shadow"
              >
                <p className="text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow h-80">
              <h2 className="font-semibold mb-2">Category Distribution</h2>
              {pieData.length === 0 ? (
                <p className="text-gray-500">No data</p>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow h-80">
              <h2 className="font-semibold mb-2">Monthly Expenses</h2>
              {barData.length === 0 ? (
                <p className="text-gray-500">No data</p>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={barData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ADD FORM */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="number"
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              type="date"
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <select
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Category</option>
              <option>Food</option>
              <option>Travel</option>
              <option>Shopping</option>
              <option>Bills</option>
              <option>Other</option>
            </select>
          </div>

          {category === "Other" && (
            <input
              className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          )}

          <button
            onClick={addExpense}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Add Expense
          </button>

          {/* CONTROLS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <input
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Search title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map(
                (m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                )
              )}
            </select>

            <select
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">No Sort</option>
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>

            <select
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>

          <button
            onClick={clearAll}
            className="w-full bg-red-600 text-white py-2 rounded"
          >
            🗑️ Clear All Expense History
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            This will permanently delete all saved expenses
          </p>

          {/* LIST */}
          <ul className="space-y-2">
            {view.map((e) => (
              <li
                key={e.id}
                className="bg-white dark:bg-gray-800 p-3 rounded shadow"
              >
                {editingId === e.id ? (
                  <div className="space-y-2">
                    {["title", "amount", "date", "category"].map((f) => (
                      <input
                        key={f}
                        type={
                          f === "amount"
                            ? "number"
                            : f === "date"
                            ? "date"
                            : "text"
                        }
                        className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={editForm[f]}
                        onChange={(x) =>
                          setEditForm({
                            ...editForm,
                            [f]: x.target.value,
                          })
                        }
                      />
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(e.id)}
                        className="flex-1 bg-green-600 text-white py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-400 text-white py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {e.title} – ₹{e.amount}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {e.category} | {e.date}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(e)}>✏️</button>
                      <button onClick={() => deleteExpense(e.id)}>❌</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
