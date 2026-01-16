import { useState, useEffect, useMemo, useCallback } from "react";
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
  Legend,
  LineChart,
  Line
} from "recharts";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  TrendingUp, 
  TrendingDown,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Moon,
  Sun,
  Bell,
  Target
} from "lucide-react";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed", "#ec4899", "#14b8a6", "#f97316"];

// Category icons for better UX
const CATEGORY_ICONS = {
  Food: "🍔",
  Travel: "✈️",
  Shopping: "🛍️",
  Bills: "📄",
  Entertainment: "🎬",
  Healthcare: "🏥",
  Education: "📚",
  Other: "📦"
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // ===== STATES =====
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  
  // Budget feature
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem("monthlyBudget");
    return saved ? JSON.parse(saved) : 10000;
  });
  
  // View mode for charts
  const [chartView, setChartView] = useState("pie"); // pie, bar, line
  const [timeRange, setTimeRange] = useState("monthly"); // weekly, monthly, yearly
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  
  // Import/Export
  const [showImportExport, setShowImportExport] = useState(false);

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
    notes: ""
  });

  // ===== NOTIFICATION SYSTEM =====
  const showNotification = useCallback((message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  }, []);

  // ===== BUDGET ALERTS =====
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    const monthExpenses = expenses.filter(e => {
      const expenseMonth = new Date(e.date).getMonth() + 1;
      return expenseMonth === currentMonth;
    });
    
    const totalMonthSpent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const budgetPercentage = (totalMonthSpent / monthlyBudget) * 100;
    
    if (budgetPercentage >= 90 && budgetPercentage < 100) {
      showNotification(`⚠️ You've used ${Math.round(budgetPercentage)}% of your monthly budget!`, "warning");
    } else if (budgetPercentage >= 100) {
      showNotification(`🚨 You've exceeded your monthly budget by ${Math.round(budgetPercentage - 100)}%!`, "error");
    }
  }, [expenses, monthlyBudget, showNotification]);

  // ===== ADD EXPENSE =====
  const addExpense = () => {
    if (!title || !amount || !date || !category) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification("Please enter a valid positive amount", "error");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      showNotification("Cannot add expenses for future dates", "error");
      return;
    }

    const newExpense = {
      id: Date.now(),
      title,
      amount: amountNum,
      date,
      category,
      notes,
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [newExpense, ...prev]);
    showNotification("Expense added successfully!", "success");
    
    // Reset form
    setTitle("");
    setAmount("");
    setCategory("");
    setNotes("");
    setDate(today);
  };

  // ===== CRUD OPERATIONS =====
  const deleteExpense = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      showNotification("Expense deleted", "info");
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      notes: expense.notes || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", amount: "", date: "", category: "", notes: "" });
  };

  const saveEdit = (id) => {
    const amountNum = Number(editForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification("Please enter a valid positive amount", "error");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (editForm.date > today) {
      showNotification("Cannot set expense date to future", "error");
      return;
    }

    setExpenses(prev => prev.map(e => 
      e.id === id ? { 
        ...e, 
        ...editForm, 
        amount: amountNum,
        updatedAt: new Date().toISOString()
      } : e
    ));
    
    cancelEdit();
    showNotification("Expense updated successfully!", "success");
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL expenses? This action cannot be undone.")) {
      setExpenses([]);
      showNotification("All expenses cleared", "info");
    }
  };

  // ===== IMPORT/EXPORT =====
  const exportData = () => {
    const data = {
      expenses,
      monthlyBudget,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("Data exported successfully!", "success");
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.expenses) {
          setExpenses(data.expenses);
          if (data.monthlyBudget) setMonthlyBudget(data.monthlyBudget);
          showNotification("Data imported successfully!", "success");
        }
      } catch (error) {
        showNotification("Invalid file format", "error");
      }
    };
    reader.readAsText(file);
  };

  // ===== STORAGE =====
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("monthlyBudget", JSON.stringify(monthlyBudget));
  }, [monthlyBudget]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ===== COMPUTED DATA with useMemo for performance =====
  const { filteredExpenses, totalAmount, pieData, barData, lineData, monthlyStats, budgetStatus } = useMemo(() => {
    // Filtering
    let filtered = expenses;
    
    if (selectedMonth) {
      filtered = filtered.filter(e => {
        const expenseMonth = new Date(e.date).getMonth() + 1;
        return expenseMonth.toString().padStart(2, '0') === selectedMonth;
      });
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.category.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    
    // Sorting
    filtered = [...filtered].sort((a, b) => {
      const multiplier = sortDir === "asc" ? 1 : -1;
      
      if (sortBy === "amount") {
        return (Number(a.amount) - Number(b.amount)) * multiplier;
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title) * multiplier;
      } else {
        return (new Date(a.date) - new Date(b.date)) * multiplier;
      }
    });
    
    // Total amount
    const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Pie chart data (category-wise)
    const pie = Object.entries(
      filtered.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {})
    ).map(([name, value]) => ({ 
      name, 
      value,
      icon: CATEGORY_ICONS[name] || "📦"
    }));
    
    // Monthly data for bar/line charts
    const monthlyData = {};
    const weeklyData = {};
    
    filtered.forEach((e) => {
      // Monthly aggregation
      const monthKey = e.date.slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(e.amount);
      
      // Weekly aggregation
      const date = new Date(e.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + Number(e.amount);
    });
    
    // Prepare chart data based on selected time range
    let bar = [];
    let line = [];
    
    if (timeRange === "monthly") {
      bar = Object.entries(monthlyData)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      line = bar.map(item => ({ ...item, name: item.month }));
    } else if (timeRange === "weekly") {
      bar = Object.entries(weeklyData)
        .map(([week, total]) => ({ week, total }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(0, 12); // Last 12 weeks
      
      line = bar.map(item => ({ ...item, name: item.week }));
    }
    
    // Monthly statistics
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const monthlyTotal = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const remainingBudget = monthlyBudget - monthlyTotal;
    const budgetPercentage = (monthlyTotal / monthlyBudget) * 100;
    
    const budgetStatus = {
      spent: monthlyTotal,
      remaining: remainingBudget,
      percentage: budgetPercentage,
      isOverBudget: monthlyTotal > monthlyBudget
    };
    
    return {
      filteredExpenses: filtered,
      totalAmount: total,
      pieData: pie,
      barData: bar,
      lineData: line,
      monthlyStats: {
        count: currentMonthExpenses.length,
        total: monthlyTotal,
        avg: currentMonthExpenses.length > 0 ? monthlyTotal / currentMonthExpenses.length : 0
      },
      budgetStatus
    };
  }, [expenses, selectedMonth, search, sortBy, sortDir, timeRange, monthlyBudget]);

  // ===== ANALYTICS FUNCTIONS =====
  const getTopSpendingCategory = () => {
    if (pieData.length === 0) return null;
    return pieData.reduce((max, item) => item.value > max.value ? item : max, pieData[0]);
  };

  const getSpendingTrend = () => {
    if (lineData.length < 2) return 0;
    const first = lineData[0].total;
    const last = lineData[lineData.length - 1].total;
    return ((last - first) / first) * 100;
  };

  const topCategory = getTopSpendingCategory();
  const spendingTrend = getSpendingTrend();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === "success" ? "bg-green-500" :
          notification.type === "error" ? "bg-red-500" :
          notification.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
        } text-white`}>
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              💰 Expense Tracker Pro
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track, analyze, and optimize your spending
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              Data
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* IMPORT/EXPORT PANEL */}
        {showImportExport && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Data Management</h3>
              <button onClick={() => setShowImportExport(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2"><Upload size={18} /> Import Data</h4>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-sm text-gray-500">Upload previously exported JSON file</p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2"><Download size={18} /> Export Data</h4>
                <button
                  onClick={exportData}
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all"
                >
                  Download All Data (JSON)
                </button>
                <p className="text-sm text-gray-500">Backup your expenses and settings</p>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100">Total Spent</p>
                <p className="text-3xl font-bold mt-2">₹{totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign size={24} className="opacity-80" />
            </div>
            <p className="text-sm text-blue-100 mt-3">{filteredExpenses.length} transactions</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100">Monthly Budget</p>
                <p className="text-3xl font-bold mt-2">₹{monthlyBudget.toLocaleString()}</p>
              </div>
              <Target size={24} className="opacity-80" />
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <span>Spent: ₹{budgetStatus.spent.toLocaleString()}</span>
                <span>{budgetStatus.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-green-700 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetStatus.isOverBudget ? 'bg-red-400' : 'bg-white'
                  }`}
                  style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100">Monthly Avg</p>
                <p className="text-3xl font-bold mt-2">₹{monthlyStats.avg.toFixed(0)}</p>
              </div>
              <TrendingUp size={24} className="opacity-80" />
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {spendingTrend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(spendingTrend).toFixed(1)}% {spendingTrend > 0 ? 'increase' : 'decrease'}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100">Top Category</p>
                <p className="text-2xl font-bold mt-2">
                  {topCategory ? `${topCategory.icon} ${topCategory.name}` : 'N/A'}
                </p>
              </div>
              <PieChartIcon size={24} className="opacity-80" />
            </div>
            <p className="text-sm text-amber-100 mt-3">
              {topCategory ? `₹${topCategory.value.toLocaleString()}` : 'No data'}
            </p>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold">Spending Analytics</h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setChartView("pie")}
                  className={`px-3 py-1 rounded ${chartView === "pie" ? "bg-white dark:bg-gray-600 shadow" : ""}`}
                >
                  <PieChartIcon size={18} />
                </button>
                <button
                  onClick={() => setChartView("bar")}
                  className={`px-3 py-1 rounded ${chartView === "bar" ? "bg-white dark:bg-gray-600 shadow" : ""}`}
                >
                  <BarChartIcon size={18} />
                </button>
                <button
                  onClick={() => setChartView("line")}
                  className={`px-3 py-1 rounded ${chartView === "line" ? "bg-white dark:bg-gray-600 shadow" : ""}`}
                >
                  <TrendingUp size={18} />
                </button>
              </div>
              
              <select
                className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
          </div>
          
          <div className="h-80">
            {chartView === "pie" ? (
              pieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>No data to display. Add some expenses!</p>
                </div>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                      label={(entry) => `${entry.name}: ₹${entry.value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`₹${value}`, "Amount"]}
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        color: darkMode ? "#f9fafb" : "#111827",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )
            ) : chartView === "bar" ? (
              <ResponsiveContainer>
                <BarChart data={chartView === "bar" ? barData : lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey={timeRange === "monthly" ? "month" : "week"} />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`₹${value}`, "Total"]}
                    contentStyle={{
                      backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                      color: darkMode ? "#f9fafb" : "#111827",
                    }}
                  />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`₹${value}`, "Total"]}
                    contentStyle={{
                      backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                      color: darkMode ? "#f9fafb" : "#111827",
                    }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Add Expense & Budget */}
          <div className="lg:col-span-1 space-y-6">
            {/* ADD EXPENSE FORM */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus size={20} /> Add New Expense
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dinner, Groceries, etc."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount *</label>
                    <input
                      className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                          category === cat 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                        <span className="text-xs mt-1">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                  <textarea
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Additional details..."
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                <button
                  onClick={addExpense}
                  className="w-full p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition-all font-medium"
                >
                  Add Expense
                </button>
              </div>
            </div>
            
            {/* BUDGET SETTINGS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target size={20} /> Budget Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Budget (₹)</label>
                  <input
                    type="number"
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent this month:</span>
                    <span className="font-medium">₹{budgetStatus.spent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className={`font-medium ${
                      budgetStatus.remaining < 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      ₹{budgetStatus.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN: Expenses List & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* CONTROLS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    className="w-full pl-10 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Search expenses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div>
                  <select
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = new Date(0, i).toLocaleString('en', { month: 'long' });
                      return (
                        <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                          {month}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <select
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="title">Sort by Title</option>
                  </select>
                </div>
                
                <div>
                  <select
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value)}
                  >
                    <option value="desc">Newest/Descending</option>
                    <option value="asc">Oldest/Ascending</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing {filteredExpenses.length} of {expenses.length} expenses
                </p>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Clear All
                </button>
              </div>
            </div>
            
            {/* EXPENSES LIST */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-lg">No expenses found</p>
                  <p className="text-sm mt-2">Add your first expense to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="p-4 text-left">Description</th>
                        <th className="p-4 text-left">Category</th>
                        <th className="p-4 text-left">Amount</th>
                        <th className="p-4 text-left">Date</th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => (
                        <tr 
                          key={expense.id} 
                          className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{expense.title}</p>
                              {expense.notes && (
                                <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{CATEGORY_ICONS[expense.category] || "📦"}</span>
                              <span>{expense.category}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold">₹{Number(expense.amount).toLocaleString()}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{new Date(expense.date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(expense)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EDIT MODAL */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit Expense</h3>
              
              <div className="space-y-4">
                <input
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    type="number"
                    placeholder="Amount"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    min="0"
                  />
                  <input
                    className="p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                  />
                </div>
                
                <select
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <textarea
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows="3"
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={() => saveEdit(editingId)}
                    className="flex-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 p-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:opacity-80 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p>Expense Tracker Pro • Built with React & Recharts • {new Date().getFullYear()}</p>
          <p className="mt-2">Track smart, save smarter 💡</p>
        </div>
      </div>
    </div>
  );
}

export default App;