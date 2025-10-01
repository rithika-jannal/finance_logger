import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";
import "./App.css";
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

// ----------------- API Setup -----------------
const api = axios.create({ baseURL: "http://localhost:5001/api" });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

// ----------------- Auth Route Guard -----------------
function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

// ----------------- Register -----------------
function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
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
            <input 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              placeholder="Enter your name" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              placeholder="Enter your email" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              onChange={e => setForm({ ...form, password: e.target.value })} 
              placeholder="Create a password" 
              required 
            />
          </div>
          <button className="btn-primary">Create Account</button>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
          <div className="divider">Already have an account?</div>
          <button type="button" className="btn-secondary" onClick={() => nav("/login")}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------- Login -----------------
function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
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
            <input
              name="email"
              type="email"
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn-primary">Sign In</button>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
          <div className="divider">Don't have an account?</div>
          <button type="button" className="btn-secondary" onClick={() => nav("/register")}>
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------- Dashboard -----------------
function Dashboard() {
  const [expenses,setExpenses] = useState([]);
  const [edit,setEdit] = useState(null);
  const [form,setForm] = useState({description:"",amount:"",date:new Date().toISOString().split('T')[0]});
  const [editForm,setEditForm] = useState({description:"",amount:""});
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

  const startEdit = exp => {
    setEdit(exp._id);
    setEditForm({description:exp.description, amount:exp.amount});
  };
  
  const saveEdit = async e => {
    e.preventDefault();
    await api.put(`/expense/${edit}`, editForm);
    setEdit(null); 
    setMessage({ text: "✅ Expense updated!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    fetchAll();
  };

  const deleteExp = async id => {
    if(window.confirm("Are you sure you want to delete this expense?")) {
      await api.delete(`/expense/${id}`);
      setMessage({ text: "✅ Expense deleted", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchAll();
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
            <button className="btn-nav" onClick={() => nav("/logs")}>View Logs</button>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="expense-form">
          <h3>Add New Expense</h3>
          <form onSubmit={submit}>
            <div className="form-row">
              <input 
                onChange={e=>setForm({...form,description:e.target.value})} 
                value={form.description} 
                placeholder="Description (e.g., Groceries)" 
                required 
              />
              <input 
                type="number" 
                onChange={e=>setForm({...form,amount:+e.target.value})} 
                value={form.amount} 
                placeholder="Amount (₹)" 
                required 
              />
              <input 
                type="date" 
                onChange={e=>setForm({...form,date:e.target.value})} 
                value={form.date} 
                required 
              />
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
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      font: {
                        size: 14,
                        weight: 'bold'
                      },
                      color: '#333'
                    }
                  },
                  tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                      label: function(context) {
                        return 'Spent: ₹' + context.parsed.y.toFixed(2);
                      },
                      title: function(context) {
                        const date = new Date(context[0].label);
                        return date.toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return '₹' + value;
                      },
                      font: {
                        size: 12
                      }
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    ticks: {
                      font: {
                        size: 12
                      }
                    },
                    grid: {
                      display: false
                    }
                  }
                },
                animation: {
                  duration: 1000,
                  easing: 'easeInOutQuart'
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------- Logs Page -----------------
function Logs() {
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
    setEditForm({
      description: exp.description, 
      amount: exp.amount,
      date: new Date(exp.date).toISOString().split('T')[0]
    });
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

  // Filter expenses
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
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <input 
            type="text"
            placeholder="🔍 Search by description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="filter-input"
          />
          <input 
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="filter-input"
          />
          {(searchTerm || filterDate) && (
            <button 
              className="btn-clear-filter" 
              onClick={() => {setSearchTerm(""); setFilterDate("");}}>
              Clear Filters
            </button>
          )}
        </div>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {/* Expenses List */}
        <div className="expenses-section">
          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">
                {expenses.length === 0 ? "No expenses yet. Go to Dashboard to add expenses!" : "No expenses match your filters."}
              </div>
            </div>
          ) : (
            <ul className="expense-list">
              {filteredExpenses.map(exp =>
                <li key={exp._id} className="expense-item">
                  {edit === exp._id ? (
                    <form className="edit-form" onSubmit={saveEdit}>
                      <input 
                        value={editForm.description} 
                        onChange={e=>setEditForm({...editForm,description:e.target.value})} 
                        placeholder="Description"
                        required 
                      />
                      <input 
                        type="number" 
                        value={editForm.amount} 
                        onChange={e=>setEditForm({...editForm,amount:+e.target.value})} 
                        placeholder="Amount"
                        required 
                      />
                      <input 
                        type="date" 
                        value={editForm.date} 
                        onChange={e=>setEditForm({...editForm,date:e.target.value})} 
                        required 
                      />
                      <button type="submit" className="btn-save">Save</button>
                      <button type="button" className="btn-cancel" onClick={()=>setEdit(null)}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div className="expense-info">
                        <div className="expense-description">{exp.description}</div>
                        <div className="expense-amount">₹{exp.amount.toFixed(2)}</div>
                        <div className="expense-date">{new Date(exp.date).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</div>
                      </div>
                      <div className="expense-actions">
                        <button className="btn-edit" onClick={()=>startEdit(exp)}>Edit</button>
                        <button className="btn-delete" onClick={()=>deleteExp(exp._id)}>Delete</button>
                      </div>
                    </>
                  )}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------- App Root -----------------
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
