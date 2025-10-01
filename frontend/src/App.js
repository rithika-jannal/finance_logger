import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
import "./App.css";
Chart.register(LineElement, CategoryScale, LinearScale, PointElement);

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
  const [form,setForm] = useState({description:"",amount:""});
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
      setForm({description:"",amount:""}); 
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
          <button className="btn-logout" onClick={logout}>Logout</button>
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
              <button className="btn-add">Add Expense</button>
            </div>
          </form>
          {message.text && <div className={`message ${message.type}`} style={{marginTop: "15px"}}>{message.text}</div>}
        </div>

        <div className="expenses-section">
          <h3>Recent Expenses</h3>
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No expenses yet. Add your first expense above!</div>
            </div>
          ) : (
            <ul className="expense-list">
              {expenses.map(exp =>
                <li key={exp._id} className="expense-item">
                  {edit === exp._id ? (
                    <>
                      <form className="edit-form" onSubmit={saveEdit}>
                        <input value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} required />
                        <input type="number" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:+e.target.value})} required />
                        <button type="submit" className="btn-save">Save</button>
                        <button type="button" className="btn-cancel" onClick={()=>setEdit(null)}>Cancel</button>
                      </form>
                    </>
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
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                  tension: 0.4,
                  fill: true
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        )}
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
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
