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
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

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
  const [sortBy, setSortBy] = useState(""); // date | amount
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

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

  // ===== ADD =====
  const addExpense = () => {
    if (!title || !amount || !date || !category) return;

    // Add validation for amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid positive amount");
      return;
    }

    // Add date validation to prevent future dates
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      alert("Cannot add expenses for future dates");
      return;
    }

    const finalCategory =
      category === "Other" ? customCategory : category;
    if (!finalCategory) return;

    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        title,
        amount: amountNum,
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
    // Add validation for edit amount
    const amountNum = Number(editForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid positive amount");
      return;
    }

    // Add date validation for edit
    const today = new Date().toISOString().split('T')[0];
    if (editForm.date > today) {
      alert("Cannot set expense date to future");
      return;
    }

    setExpenses(
      expenses.map((e) =>
        e.id === id ? { ...e, ...editForm, amount: amountNum } : e
      )
    );
    cancelEdit();
  };

  const clearAll = () => {
    if (window.confirm("Delete all expenses?")) {
      setExpenses([]);
      localStorage.removeItem("expenses");
    }
  };

  // ===== STORAGE =====
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  // ===== VIEW PIPELINE (FILTER → SEARCH → SORT) =====
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
      if (x < y) return sortDir === "asc" ? -1 : 1;
      if (x > y) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ===== DASHBOARD DATA =====
  const totalAmount = view.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  // Pie data (category-wise)
  const pieData = Object.entries(
    view.reduce((acc, e) => {
      acc[e.category] =
        (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Bar data (monthly)
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400">
          Expense Dashboard
        </h1>

        <div className="flex justify-end">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 dark:text-white"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-gray-500 dark:text-gray-400">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ₹{totalAmount}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-gray-500 dark:text-gray-400">Transactions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{view.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-gray-500 dark:text-gray-400">Categories</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pieData.length}
            </p>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow h-80">
            <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Category Distribution
            </h2>
            {pieData.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No data</p>
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
                    {pieData.map((entry, i) => (
                      <Cell
                        key={`cell-${i}-${entry.name}`}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                      color: darkMode ? "#f9fafb" : "#111827",
                      borderRadius: "8px",
                      border: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow h-80">
            <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Monthly Expenses
            </h2>
            {barData.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No data</p>
            ) : (
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                      color: darkMode ? "#f9fafb" : "#111827",
                      borderRadius: "8px",
                      border: "none",
                    }}
                  />
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
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <input
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
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
            onChange={(e) =>
              setCustomCategory(e.target.value)
            }
          />
        )}

        <button
          onClick={addExpense}
          className="w-full bg-blue-600 text-white py-2 rounded dark:bg-blue-700"
        >
          Add Expense
        </button>

        {/* CONTROLS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
          <select
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">No Sort</option>
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
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
          className="w-full bg-red-600 text-white py-2 rounded dark:bg-red-700"
        >
          🗑️ Clear All Expense History
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
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
                  <input
                    className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={editForm.title}
                    onChange={(x) =>
                      setEditForm({
                        ...editForm,
                        title: x.target.value,
                      })
                    }
                  />
                  <input
                    className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    type="number"
                    value={editForm.amount}
                    onChange={(x) =>
                      setEditForm({
                        ...editForm,
                        amount: x.target.value,
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                  <input
                    className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    type="date"
                    value={editForm.date}
                    onChange={(x) =>
                      setEditForm({
                        ...editForm,
                        date: x.target.value,
                      })
                    }
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={editForm.category}
                    onChange={(x) =>
                      setEditForm({
                        ...editForm,
                        category: x.target.value,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(e.id)}
                      className="flex-1 bg-green-600 text-white py-1 rounded dark:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-400 text-white py-1 rounded dark:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {e.title} – ₹{e.amount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {e.category} | {e.date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExpense(e.id)}
                      className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;