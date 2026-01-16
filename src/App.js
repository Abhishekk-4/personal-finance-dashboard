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
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed", "#ec4899"];

function App() {
  const [type, setType] = useState("expense");
  const [chartView, setChartView] = useState("both");

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // ===== STATES =====
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem("expenses");
    const data = saved ? JSON.parse(saved) : [];
    return data.map(exp => ({
      ...exp,
      type: exp.type || "expense"
    }));
  });

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    amount: "",
    date: "",
    category: "",
    type: "expense",
  });

  // ===== ADD =====
  const addExpense = () => {
    if (!title || !amount || !date || !category) {
      alert("Please fill all fields");
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Enter valid amount");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      alert("Cannot add future dates");
      return;
    }

    const finalCategory = category === "Other" ? customCategory : category;
    if (!finalCategory) {
      alert("Enter category");
      return;
    }

    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        title,
        amount: amountNum,
        date,
        category: finalCategory,
        type,
      },
    ]);

    setTitle("");
    setAmount("");
    setCategory("");
    setCustomCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setType("expense");
  };

  // ===== CRUD =====
  const deleteExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  const startEdit = (e) => {
    setEditingId(e.id);
    setEditForm({
      title: e.title,
      amount: e.amount.toString(),
      date: e.date,
      category: e.category,
      type: e.type,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", amount: "", date: "", category: "", type: "expense" });
  };

  const saveEdit = (id) => {
    const amountNum = Number(editForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Enter valid amount");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (editForm.date > today) {
      alert("Cannot set future date");
      return;
    }

    setExpenses(
      expenses.map(e => e.id === id ? { ...e, ...editForm, amount: amountNum } : e)
    );
    cancelEdit();
  };

  const clearAll = () => {
    if (window.confirm("Delete all transactions?")) {
      setExpenses([]);
    }
  };

  // ===== STORAGE =====
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  // ===== FILTER, SEARCH, SORT =====
  let view = selectedMonth
    ? expenses.filter(e => e.date && e.date.split("-")[1] === selectedMonth)
    : expenses;

  if (filterType !== "all") {
    if (filterType === "expense") {
      view = view.filter(e => e.type === "expense" || !e.type);
    } else if (filterType === "income") {
      view = view.filter(e => e.type === "income");
    }
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    view = view.filter(e => e.title.toLowerCase().includes(q));
  }

  if (sortBy) {
    view = [...view].sort((a, b) => {
      let x = sortBy === "amount" ? Number(a.amount) : a.date;
      let y = sortBy === "amount" ? Number(b.amount) : b.date;
      if (x < y) return sortDir === "asc" ? -1 : 1;
      if (x > y) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Separate data
  const expenseView = view.filter(e => e.type === "expense" || !e.type);
  const incomeView = view.filter(e => e.type === "income");
  const investmentView = view.filter(e => e.type === "investment");

  // ===== DARK MODE =====
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
  const totalExpenses = expenseView.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = incomeView.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalInvestment = investmentView.reduce((sum, e) => sum + Number(e.amount), 0);
  const netBalance = totalIncome - totalExpenses - totalInvestment;

  // Category-wise totals
  const categoryData = {};
  view.forEach(e => {
    if (!categoryData[e.category]) {
      categoryData[e.category] = { expense: 0, income: 0, investment: 0 };
    }
    if (e.type === "income") {
      categoryData[e.category].income += Number(e.amount);
    } else if (e.type === "investment") {
      categoryData[e.category].investment += Number(e.amount);
    } else {
      categoryData[e.category].expense += Number(e.amount);
    }
  });

  // Pie chart data (spending = expenses + investments)
  const spendingData = [...expenseView, ...investmentView];
  const pieData = Object.entries(
    spendingData.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Monthly data for charts (using VIEW to respect filters)
  const monthMap = {};
  view.forEach((e) => {
    const m = e.date?.slice(0, 7);
    if (!m) return;
    if (!monthMap[m]) {
      monthMap[m] = { month: m, expense: 0, income: 0, investment: 0 };
    }
    if (e.type === "income") {
      monthMap[m].income += Number(e.amount);
    } else if (e.type === "investment") {
      monthMap[m].investment += Number(e.amount);
    } else {
      monthMap[m].expense += Number(e.amount);
    }
  });

  const barData = Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(item => ({
      ...item,
      spending: item.expense + item.investment,
      total: item.income + item.expense + item.investment
    }));

  // Prepare data for charts based on chartView
  const getChartData = () => {
    if (chartView === "expense") {
      return barData.map(item => ({ month: item.month, amount: item.expense }));
    } else if (chartView === "income") {
      return barData.map(item => ({ month: item.month, amount: item.income }));
    } else if (chartView === "investment") {
      return barData.map(item => ({ month: item.month, amount: item.investment }));
    }
    return barData;
  };

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400">
          Financial Dashboard
        </h1>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 dark:text-white ml-auto block"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              ₹{totalIncome}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              ₹{totalExpenses}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Investments</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ₹{totalInvestment}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Balance</p>
            <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{netBalance}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {view.length}
            </p>
          </div>
        </div>

        {/* CATEGORY-WISE TOTALS */}
        {Object.keys(categoryData).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Category-wise Totals
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(categoryData).map(([category, data]) => (
                <div key={category} className="border rounded p-3 dark:border-gray-600">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{category}</p>
                  {data.expense > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Exp: ₹{data.expense}
                    </p>
                  )}
                  {data.income > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Inc: ₹{data.income}
                    </p>
                  )}
                  {data.investment > 0 && (
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Inv: ₹{data.investment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">
                Spending Distribution
              </h2>
              <select
                className="p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>
            {pieData.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 h-64 flex items-center justify-center">
                No spending data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                      color: darkMode ? "#f9fafb" : "#111827",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-gray-700 dark:text-gray-200">
                Monthly Overview
              </h2>
              <select
                className="p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                value={chartView}
                onChange={e => setChartView(e.target.value)}
              >
                <option value="both">Both</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
                <option value="investment">Investments Only</option>
              </select>
            </div>
            {barData.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 h-64 flex items-center justify-center">
                No data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                {chartView === "both" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        color: darkMode ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="expense" fill="#dc2626" name="Expenses" />
                    <Bar dataKey="income" fill="#16a34a" name="Income" />
                    <Bar dataKey="investment" fill="#7c3aed" name="Investments" />
                  </BarChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        color: darkMode ? "#f9fafb" : "#111827",
                      }}
                    />
                    <Bar dataKey="amount" fill={
                      chartView === "expense" ? "#dc2626" : 
                      chartView === "income" ? "#16a34a" : 
                      "#7c3aed"
                    } />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LINE CHART */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">
            Income vs Spending Trend
          </h2>
          {barData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 h-64 flex items-center justify-center">
              No data
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                    color: darkMode ? "#f9fafb" : "#111827",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#16a34a" name="Income" strokeWidth={2} />
                <Line type="monotone" dataKey="spending" stroke="#dc2626" name="Spending" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ADD FORM */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === "expense"}
                onChange={() => setType("expense")}
              />
              <span>Expense</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === "income"}
                onChange={() => setType("income")}
              />
              <span>Income</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={type === "investment"}
                onChange={() => setType("investment")}
              />
              <span>Investment</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <input
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
            />
            <input
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <select
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">Category</option>
              {type === "income" ? (
                <>
                  <option>Salary</option>
                  <option>Freelance</option>
                  <option>Other</option>
                </>
              ) : type === "investment" ? (
                <>
                  <option>Stocks</option>
                  <option>Mutual Funds</option>
                  <option>Other</option>
                </>
              ) : (
                <>
                  <option>Food</option>
                  <option>Travel</option>
                  <option>Shopping</option>
                  <option>Bills</option>
                  <option>Other</option>
                </>
              )}
            </select>
          </div>

          {category === "Other" && (
            <input
              className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600"
              placeholder={`Custom ${type} category`}
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
            />
          )}

          <button
            onClick={addExpense}
            className="w-full bg-blue-600 text-white py-2 rounded dark:bg-blue-700"
          >
            Add {type === "expense" ? "Expense" : type === "income" ? "Income" : "Investment"}
          </button>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="Search title"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
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
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>
          <select
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="">No Sort</option>
            <option value="date">Date</option>
            <option value="amount">Amount</option>
          </select>
          <select
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            value={sortDir}
            onChange={e => setSortDir(e.target.value)}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>

        <button
          onClick={clearAll}
          className="w-full bg-red-600 text-white py-2 rounded dark:bg-red-700"
        >
          🗑️ Clear All Transactions
        </button>

        {/* SEPARATED TRANSACTION LISTS */}
        <div className="space-y-6">
          {/* INCOME LIST */}
          {incomeView.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center">
                <span className="mr-2">📈</span> Income ({incomeView.length})
              </h3>
              <div className="space-y-2">
                {incomeView.map((e) => (
                  <ListItem key={e.id} e={e} editingId={editingId} editForm={editForm} setEditForm={setEditForm} startEdit={startEdit} deleteExpense={deleteExpense} saveEdit={saveEdit} cancelEdit={cancelEdit} />
                ))}
              </div>
            </div>
          )}

          {/* EXPENSE LIST */}
          {expenseView.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center">
                <span className="mr-2">📉</span> Expenses ({expenseView.length})
              </h3>
              <div className="space-y-2">
                {expenseView.map((e) => (
                  <ListItem key={e.id} e={e} editingId={editingId} editForm={editForm} setEditForm={setEditForm} startEdit={startEdit} deleteExpense={deleteExpense} saveEdit={saveEdit} cancelEdit={cancelEdit} />
                ))}
              </div>
            </div>
          )}

          {/* INVESTMENT LIST */}
          {investmentView.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-3 flex items-center">
                <span className="mr-2">💼</span> Investments ({investmentView.length})
              </h3>
              <div className="space-y-2">
                {investmentView.map((e) => (
                  <ListItem key={e.id} e={e} editingId={editingId} editForm={editForm} setEditForm={setEditForm} startEdit={startEdit} deleteExpense={deleteExpense} saveEdit={saveEdit} cancelEdit={cancelEdit} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EMPTY STATE */}
        {view.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {expenses.length === 0 
              ? "No transactions found. Add one above!" 
              : "No transactions match your filters."}
          </div>
        )}
      </div>
    </div>
  );
}

// List Item Component
function ListItem({ e, editingId, editForm, setEditForm, startEdit, deleteExpense, saveEdit, cancelEdit }) {
  const getIcon = (type) => {
    if (type === "income") return "🟢 +";
    if (type === "investment") return "💼 -";
    return "🔴 -";
  };

  const getColor = (type) => {
    if (type === "income") return "border-green-500 bg-green-50 dark:bg-green-900/20";
    if (type === "investment") return "border-purple-500 bg-purple-50 dark:bg-purple-900/20";
    return "border-red-500 bg-red-50 dark:bg-red-900/20";
  };

  return (
    <div className={`p-3 rounded border-l-4 ${getColor(e.type)}`}>
      {editingId === e.id ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            {["expense", "income", "investment"].map(t => (
              <label key={t} className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={editForm.type === t}
                  onChange={() => setEditForm({...editForm, type: t})}
                />
                <span className="text-sm capitalize">{t}</span>
              </label>
            ))}
          </div>
          <input
            className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600"
            value={editForm.title}
            onChange={x => setEditForm({...editForm, title: x.target.value})}
          />
          <input
            className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600"
            type="number"
            value={editForm.amount}
            onChange={x => setEditForm({...editForm, amount: x.target.value})}
          />
          <input
            className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600"
            type="date"
            value={editForm.date}
            onChange={x => setEditForm({...editForm, date: x.target.value})}
          />
          <input
            className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600"
            value={editForm.category}
            onChange={x => setEditForm({...editForm, category: x.target.value})}
          />
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
            <p className="font-medium dark:text-gray-100">
              {getIcon(e.type)} {e.title} – ₹{e.amount}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {e.category} | {e.date}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => startEdit(e)}
              className="text-blue-600 dark:text-blue-400"
            >
              ✏️
            </button>
            <button
              onClick={() => deleteExpense(e.id)}
              className="text-red-600 dark:text-red-400"
            >
              ❌
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;