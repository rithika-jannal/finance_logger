import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";
import "./App.css";
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const api = axios.create({ baseURL: "http://localhost:5001/api" });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      const response = await api.post("/register", form);
      setMessage({ text: "✅ " + response.data.message + " Redirecting to login...", type: "success" });
      setTimeout(() => nav("/login"), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed";
      setMessage({ text: "⚠️ " + errorMsg, type: "error" });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="subtitle">Join us to track your expenses</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{position: "relative"}}>
              <input
                type={showPassword ? "text" : "password"}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Create a password"
                required
                style={{paddingRight: "40px"}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#666"
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button className="btn-primary">Create Account</button>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
          <div className="divider">Already have an account?</div>
          <button type="button" className="btn-secondary" onClick={() => nav("/login")}>Sign In</button>
        </form>
      </div>
    </div>
  );
}

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      let { data } = await api.post("/login", form);
      localStorage.setItem("token", data.token);
      setMessage({ text: "✅ Login successful! Redirecting...", type: "success" });
      setTimeout(() => nav("/dashboard"), 800);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid login credentials";
      setMessage({ text: "⚠️ " + errorMsg, type: "error" });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to continue tracking your expenses</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email Address</label>
            <input name="email" type="email" onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{position: "relative"}}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                required
                style={{paddingRight: "40px"}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#666"
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary">Sign In</button>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
          <div className="divider">Don't have an account?</div>
          <button type="button" className="btn-secondary" onClick={() => nav("/register")}>Create Account</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [expenses,setExpenses] = useState([]);
  const [form,setForm] = useState({description:"",amount:"",date:new Date().toISOString().split('T')[0]});
  const [message,setMessage] = useState({ text: "", type: "" });
  const [summary,setSummary] = useState({});
  const nav = useNavigate();

  const fetchAll = async () => {
    try {
      let { data } = await api.get("/expense");
      setExpenses(data);
      const last7days = {};
      data.forEach(exp => {
        const d = new Date(exp.date).toISOString().split("T")[0];
        last7days[d] = (last7days[d] || 0) + exp.amount;
      });
      setSummary(last7days);
    } catch {
      setMessage({ text: "⚠️ Failed to fetch expenses", type: "error" });
    }
  };

  useEffect(()=>{ fetchAll(); },[]);

  const submit = async e => {
    e.preventDefault();
    try {
      await api.post("/expense", form);
      setForm({description:"",amount:"",date:new Date().toISOString().split('T')[0]}); 
      setMessage({ text: "✅ Expense added successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchAll();
    } catch { 
      setMessage({ text: "❌ Error adding expense", type: "error" }); 
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h2>💰 Expense Tracker</h2>
            <p style={{color: "#666", marginTop: "5px"}}>Total Spent: ₹{totalExpenses.toFixed(2)}</p>
          </div>
          <div style={{display: "flex", gap: "10px"}}>
            <button className="btn-nav" onClick={() => nav("/expense-logs")}>View Expenses</button>
            <button className="btn-nav" onClick={() => nav("/audit-logs")}>Audit Logs</button>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="expense-form">
          <h3>Add New Expense</h3>
          <form onSubmit={submit}>
            <div className="form-row">
              <input onChange={e=>setForm({...form,description:e.target.value})} value={form.description} placeholder="Description (e.g., Groceries)" required />
              <input type="number" onChange={e=>setForm({...form,amount:+e.target.value})} value={form.amount} placeholder="Amount (₹)" required />
              <input type="date" onChange={e=>setForm({...form,date:e.target.value})} value={form.date} required />
              <button className="btn-add">Add Expense</button>
            </div>
          </form>
          {message.text && <div className={`message ${message.type}`} style={{marginTop: "15px"}}>{message.text}</div>}
        </div>

        {Object.keys(summary).length > 0 && (
          <div className="chart-section">
            <h3>📈 Spending Trend (Last 7 Days)</h3>
            <Line 
              data={{
                labels: Object.keys(summary),
                datasets: [{
                  label: "Daily Spending (₹)",
                  data: Object.values(summary),
                  borderColor: "#667eea",
                  backgroundColor: "rgba(102, 126, 234, 0.2)",
                  tension: 0.4,
                  fill: true,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBackgroundColor: "#667eea",
                  pointBorderColor: "#fff",
                  pointBorderWidth: 2,
                  pointHoverBackgroundColor: "#fff",
                  pointHoverBorderColor: "#667eea",
                  pointHoverBorderWidth: 3
                }]
              }}
              options={{
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: { display: true, position: 'top', labels: { font: { size: 14, weight: 'bold' }, color: '#333' } },
                  tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    padding: 12,
                    callbacks: {
                      label: ctx => 'Spent: ₹' + ctx.parsed.y.toFixed(2),
                      title: ctx => new Date(ctx[0].label).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                    }
                  }
                },
                scales: {
                  y: { beginAtZero: true, ticks: { callback: v => '₹' + v, font: { size: 12 } }, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                  x: { ticks: { font: { size: 12 } }, grid: { display: false } }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ExpenseLogs() {
  const [expenses, setExpenses] = useState([]);
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({description:"", amount:"", date:""});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const nav = useNavigate();

  const fetchAll = async () => {
    try {
      let { data } = await api.get("/expense");
      setExpenses(data);
    } catch {
      setMessage({ text: "⚠️ Failed to fetch expenses", type: "error" });
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const startEdit = exp => {
    setEdit(exp._id);
    setEditForm({ description: exp.description, amount: exp.amount, date: new Date(exp.date).toISOString().split('T')[0] });
  };

  const saveEdit = async e => {
    e.preventDefault();
    try {
      await api.put(`/expense/${edit}`, editForm);
      setEdit(null);
      setMessage({ text: "✅ Expense updated!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchAll();
    } catch {
      setMessage({ text: "❌ Error updating expense", type: "error" });
    }
  };

  const deleteExp = async id => {
    if(window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await api.delete(`/expense/${id}`);
        setMessage({ text: "✅ Expense deleted", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        fetchAll();
      } catch {
        setMessage({ text: "❌ Error deleting expense", type: "error" });
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? new Date(exp.date).toISOString().split('T')[0] === filterDate : true;
    return matchesSearch && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h2>📋 Expense Logs</h2>
            <p style={{color: "#666", marginTop: "5px"}}>Total: ₹{totalExpenses.toFixed(2)} ({filteredExpenses.length} expenses)</p>
          </div>
          <div style={{display: "flex", gap: "10px"}}>
            <button className="btn-nav" onClick={() => nav("/dashboard")}>Dashboard</button>
            <button className="btn-nav" onClick={() => nav("/audit-logs")}>Audit Logs</button>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="filters-section">
          <input type="text" placeholder="🔍 Search by description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-input" />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="filter-input" />
          {(searchTerm || filterDate) && (
            <button className="btn-clear-filter" onClick={() => {setSearchTerm(""); setFilterDate("");}}>Clear Filters</button>
          )}
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <div className="expenses-section">
          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">{expenses.length === 0 ? "No expenses yet. Go to Dashboard to add expenses!" : "No expenses match your filters."}</div>
            </div>
          ) : (
            <ul className="expense-list">
              {filteredExpenses.map(exp => (
                <li key={exp._id} className="expense-item">
                  {edit === exp._id ? (
                    <form className="edit-form" onSubmit={saveEdit}>
                      <input value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} placeholder="Description" required />
                      <input type="number" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:+e.target.value})} placeholder="Amount" required />
                      <input type="date" value={editForm.date} onChange={e=>setEditForm({...editForm,date:e.target.value})} required />
                      <button type="submit" className="btn-save">Save</button>
                      <button type="button" className="btn-cancel" onClick={()=>setEdit(null)}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div className="expense-info">
                        <div className="expense-description">{exp.description}</div>
                        <div className="expense-amount">₹{exp.amount.toFixed(2)}</div>
                        <div className="expense-date">{new Date(exp.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                      <div className="expense-actions">
                        <button className="btn-edit" onClick={()=>startEdit(exp)}>Edit</button>
                        <button className="btn-delete" onClick={()=>deleteExp(exp._id)}>Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [filterAction, setFilterAction] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction !== "ALL") params.append("action", filterAction);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const { data } = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/audit-logs/stats");
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filterAction, startDate, endDate]);

  const logout = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        // Create axios instance with token for logout call
        const logoutApi = axios.create({
          baseURL: "http://localhost:5001/api",
          headers: { Authorization: `Bearer ${token}` }
        });

        // Make logout API call first
        await logoutApi.post("/logout");
        console.log("Logout logged successfully");
      } catch (error) {
        console.error("Logout API error:", error);
        // Continue with logout even if API fails
      }
    }

    // Clear token and redirect after API call
    localStorage.removeItem("token");
    nav("/login");
  };

  const clearFilters = () => {
    setFilterAction("ALL");
    setStartDate("");
    setEndDate("");
  };

  const getActionColor = (action) => {
    const colors = { LOGIN: "#17a2b8", ADD_EXPENSE: "#667eea", UPDATE_EXPENSE: "#ffc107", DELETE_EXPENSE: "#dc3545" };
    return colors[action] || "#6c757d";
  };

  const getActionIcon = (action) => {
    const icons = { LOGIN: "🔐", ADD_EXPENSE: "➕", UPDATE_EXPENSE: "✏️", DELETE_EXPENSE: "🗑️" };
    return icons[action] || "📝";
  };

  const getActionDisplayName = (action) => {
    const displayNames = {
      'LOGIN': 'Login',
      'ADD_EXPENSE': 'Add',
      'UPDATE_EXPENSE': 'Edit',
      'DELETE_EXPENSE': 'Delete'
    };
    return displayNames[action] || action.replace(/_/g, " ");
  };

  const getChangedFrom = (action, details) => {
    if (!details) return "-";
    switch (action) {
      case "UPDATE_EXPENSE":
        if (details.oldData) {
          return `${details.oldData.description} (₹${details.oldData.amount})`;
        }
        return "-";
      case "LOGIN":
        return "-"; // Show hyphen for empty login fields
      case "ADD_EXPENSE":
        return "No expense";
      case "DELETE_EXPENSE":
        return `${details.description} (₹${details.amount})`;
      default:
        return "-";
    }
  };

  const getChangedTo = (action, details) => {
    if (!details) return "-";
    switch (action) {
      case "UPDATE_EXPENSE":
        if (details.newData) {
          return `${details.newData.description} (₹${details.newData.amount})`;
        }
        return "-";
      case "LOGIN":
        return "-"; // Show hyphen for empty login fields
      case "ADD_EXPENSE":
        return `${details.description} (₹${details.amount})`;
      case "DELETE_EXPENSE":
        return "Deleted";
      default:
        return "-";
    }
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h2>🔍 Audit Logs</h2>
            <p style={{color: "#666", marginTop: "5px"}}>Track all account activities</p>
          </div>
          <div style={{display: "flex", gap: "10px"}}>
            <button className="btn-nav" onClick={() => nav("/dashboard")}>Dashboard</button>
            <button className="btn-nav" onClick={() => nav("/expense-logs")}>Expenses</button>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card" style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}}>
            <div className="stat-value">{logs.length}</div>
            <div className="stat-label">Total Activities</div>
          </div>
          <div className="stat-card" style={{background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"}}>
            <div className="stat-value">{stats.ADD_EXPENSE || 0}</div>
            <div className="stat-label">Expenses Added</div>
          </div>
          <div className="stat-card" style={{background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"}}>
            <div className="stat-value">{stats.UPDATE_EXPENSE || 0}</div>
            <div className="stat-label">Expenses Edited</div>
          </div>
          <div className="stat-card" style={{background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"}}>
            <div className="stat-value">{stats.LOGIN || 0}</div>
            <div className="stat-label">Login Sessions</div>
          </div>
        </div>

        <div className="filters-section">
          {/* Date Range Filters */}
          <div className="date-filters">
            <label className="filter-label">Date Range:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${!startDate && !endDate ? "active" : ""}`}
                onClick={() => { setStartDate(""); setEndDate(""); }}
              >
                All Time
              </button>
              <button
                className={`filter-btn ${startDate === new Date().toISOString().split('T')[0] && !endDate ? "active" : ""}`}
                onClick={() => { setStartDate(new Date().toISOString().split('T')[0]); setEndDate(""); }}
              >
                Today
              </button>
              <button
                className={`filter-btn ${startDate === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && !endDate ? "active" : ""}`}
                onClick={() => { setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); setEndDate(""); }}
              >
                This Week
              </button>
              <button
                className={`filter-btn ${startDate === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && !endDate ? "active" : ""}`}
                onClick={() => { setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); setEndDate(""); }}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="advanced-filters">
            <div className="filter-group">
              <label className="filter-label">Action:</label>
              <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="filter-input">
                <option value="ALL">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="ADD_EXPENSE">Add</option>
                <option value="UPDATE_EXPENSE">Edit</option>
                <option value="DELETE_EXPENSE">Delete</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">From:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="filter-input" />
            </div>
            <div className="filter-group">
              <label className="filter-label">To:</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="filter-input" />
            </div>
          </div>

          {/* Clear Filters */}
          {(filterAction !== "ALL" || startDate || endDate) && (
            <button className="btn-clear-filter" onClick={clearFilters}>Clear All Filters</button>
          )}
        </div>

        <div className="audit-logs-section">
          {loading ? (
            <div className="empty-state"><div className="empty-state-text">Loading audit logs...</div></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No audit logs found</div>
            </div>
          ) : (
            <div className="audit-table-container">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Field Changed From</th>
                    <th>Changed To</th>
                    <th>Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log._id || index}>
                      <td>
                        <span className="action-badge" style={{background: getActionColor(log.action)}}>
                          {getActionIcon(log.action)} {getActionDisplayName(log.action)}
                        </span>
                      </td>
                      <td>{log.userEmail}</td>
                      <td>{getChangedFrom(log.action, log.details)}</td>
                      <td>{getChangedTo(log.action, log.details)}</td>
                      <td>{new Date(log.timestamp).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/expense-logs" element={<PrivateRoute><ExpenseLogs /></PrivateRoute>} />
        <Route path="/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
