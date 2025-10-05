import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import "./App.css";
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ----------------- API Setup -----------------
const api = axios.create({ baseURL: "http://localhost:5001/api" });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  console.log("API Request:", config.url, "Token present:", !!token);
  if (token) {
    config.headers.Authorization = "Bearer " + token;
    console.log("Added auth header");
  }
  return config;
});

api.interceptors.response.use(
  response => {
    console.log("API Response:", response.config.url, response.status);
    return response;
  },
  error => {
    console.error("API Error:", error.config?.url, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// ----------------- Auth Route Guard -----------------
function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

// ----------------- Profile Component -----------------
function Profile({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // Fetch user profile details
  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile...");
      const response = await api.get('/user-profile');
      console.log("Profile response:", response.data);
      setUserProfile(response.data);
      console.log("Updated userProfile state:", response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setMessage({ text: 'Failed to load profile', type: 'error' });
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'profile') {
      fetchUserProfile();
    }
  }, [isOpen, activeTab]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rememberedEmail");
    onClose();
    nav("/login");
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ text: "New passwords don't match", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.put("/change-password", { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setMessage({ text: "Password changed successfully!", type: "success" });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setMessage({ text: '', type: '' });
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({ text: error.response?.data?.message || "Failed to change password", type: "error" });
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '0',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Profile Settings</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: activeTab === 'profile' ? 'white' : 'transparent',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === 'profile' ? '#667eea' : '#64748b',
              borderBottom: activeTab === 'profile' ? '3px solid #667eea' : 'none',
              cursor: 'pointer'
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: activeTab === 'password' ? 'white' : 'transparent',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === 'password' ? '#667eea' : '#64748b',
              borderBottom: activeTab === 'password' ? '3px solid #667eea' : 'none',
              cursor: 'pointer'
            }}
          >
            Password
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'profile' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Full Name
                </label>
                <div style={{
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  fontSize: '14px',
                  color: '#4a5568'
                }}>
                  {userProfile.name || 'Loading...'}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Email Address
                </label>
                <div style={{
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  fontSize: '14px',
                  color: '#4a5568'
                }}>
                  {userProfile.email || 'Loading...'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    padding: '12px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={changePassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                  <span onClick={() => setShowPassword(s => ({...s, current: !s.current}))} style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#888'
                  }} title={showPassword.current ? 'Hide' : 'Show'}>
                    {showPassword.current ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    placeholder="Enter new password"
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                    minLength="6"
                  />
                  <span onClick={() => setShowPassword(s => ({...s, new: !s.new}))} style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#888'
                  }} title={showPassword.new ? 'Hide' : 'Show'}>
                    {showPassword.new ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                    minLength="6"
                  />
                  <span onClick={() => setShowPassword(s => ({...s, confirm: !s.confirm}))} style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: '#888'
                  }} title={showPassword.confirm ? 'Hide' : 'Show'}>
                    {showPassword.confirm ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    padding: '12px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            </form>
          )}

          {message.text && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              fontSize: '14px'
            }}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------- Register -----------------
function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ main: false, confirm: false });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (form.password !== form.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...submitForm } = form;
      const response = await api.post("/register", submitForm);
      setMessage({ text: response.data.message + " Redirecting to login...", type: "success" });
      setTimeout(() => nav("/login"), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed";
      setMessage({ text: errorMsg, type: "error" });
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{textAlign: 'center', marginBottom: '8px'}}>
          <h2>Create Account</h2>
          <p className="subtitle">Join us to track your expenses</p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              onChange={e => setForm({ ...form, name: e.target.value })}
              value={form.name}
              placeholder="Enter your name"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              onChange={e => setForm({ ...form, email: e.target.value })}
              value={form.email}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword.main ? 'text' : 'password'}
                onChange={e => setForm({ ...form, password: e.target.value })}
                value={form.password}
                placeholder="Create a password"
                required
                disabled={loading}
                minLength="6"
              />
              <span onClick={() => setShowPassword(s => ({...s, main: !s.main}))} style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: 18,
                color: '#888'
              }} title={showPassword.main ? 'Hide' : 'Show'}>
                {showPassword.main ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                value={form.confirmPassword}
                placeholder="Confirm password"
                required
                disabled={loading}
                minLength="6"
                style={{ marginBottom: 0 }}
              />
              <span onClick={() => setShowPassword(s => ({...s, confirm: !s.confirm}))} style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: 18,
                color: '#888'
              }} title={showPassword.confirm ? 'Hide' : 'Show'}>
                {showPassword.confirm ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          <button
            type="submit"
            className={`btn-primary ${loading ? 'btn-loading' : ''}`}
            disabled={loading || !form.name || !form.email || !form.password}
          >
            {loading ? '' : 'Create Account'}
          </button>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
          <div className="divider"><span>Already have an account?</span></div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => nav("/login")}
            disabled={loading}
          >
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
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      let { data } = await api.post("/login", form);
      localStorage.setItem("token", data.token);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", form.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }


      setMessage({ text: "Login successful! Redirecting...", type: "success" });
      setTimeout(() => nav("/dashboard"), 800);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid login credentials";
      setMessage({ text: errorMsg, type: "error" });
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setForm(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{textAlign: 'center', marginBottom: '8px'}}>
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to continue tracking your expenses</p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={{ width: '100%', padding: '12px 40px 12px 16px' }}
              />
              <span onClick={() => setShowPassword(s => !s)} style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: 18,
                color: '#888'
              }} title={showPassword ? 'Hide' : 'Show'}>
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', color: '#4a5568'}}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                disabled={loading}
                style={{marginRight: '8px'}}
              />
              Remember me
            </label>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className={`btn-primary ${loading ? 'btn-loading' : ''}`}
            disabled={loading || !form.email || !form.password}
          >
            {loading ? '' : 'Sign In'}
          </button>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          <div className="divider"><span>Don't have an account?</span></div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => nav("/register")}
            disabled={loading}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------- Dashboard -----------------
function Dashboard({ onProfileOpen }) {
  const [expenses,setExpenses] = useState([]);
  const [edit,setEdit] = useState(null);
  const [form,setForm] = useState({description:"",amount:"",date:new Date().toISOString().split('T')[0]});
  const [editForm,setEditForm] = useState({description:"",amount:""});
  const [message,setMessage] = useState({ text: "", type: "" });
  const [summary,setSummary] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
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
    } catch (error) {
      setMessage({ text: "⚠️ Failed to fetch expenses", type: "error" });
    }
  };

  useEffect(()=>{ fetchAll(); },[]);

  const submit = async e => {
    e.preventDefault();

    // Basic validation
    if (!form.description.trim() || !form.amount || !form.date) {
      setMessage({ text: "❌ Please fill all fields", type: "error" });
      return;
    }

    if (form.amount <= 0) {
      setMessage({ text: "❌ Amount must be greater than 0", type: "error" });
      return;
    }

    console.log("Submitting expense:", form); // Debug log

    try {
      const response = await api.post("/expense", form);
      console.log("Expense created successfully:", response.data); // Debug log

      setForm({description:"",amount:"",date:new Date().toISOString().split('T')[0]});
      setMessage({ text: "✅ Expense added successfully!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchAll();
    } catch (error) {
      console.error("Error creating expense:", error); // Debug log
      const errorMsg = error.response?.data?.message || "❌ Error adding expense";
      setMessage({ text: errorMsg, type: "error" });
    }
  };

  const startEdit = exp => {
    setEdit(exp._id);
    setEditForm({description:exp.description, amount:exp.amount});
  };
  
  const saveEdit = async e => {
    e.preventDefault();

    // Basic validation
    if (!editForm.description.trim() || !editForm.amount) {
      setMessage({ text: "❌ Please fill all fields", type: "error" });
      return;
    }

    if (editForm.amount <= 0) {
      setMessage({ text: "❌ Amount must be greater than 0", type: "error" });
      return;
    }

    console.log("Updating expense:", editForm); // Debug log

    try {
      await api.put(`/expense/${edit}`, editForm);
      setEdit(null);
      setMessage({ text: "✅ Expense updated!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchAll();
    } catch (error) {
      console.error("Error updating expense:", error); // Debug log
      const errorMsg = error.response?.data?.message || "❌ Error updating expense";
      setMessage({ text: errorMsg, type: "error" });
    }
  };

  const deleteExp = async id => {
    if(window.confirm("Are you sure you want to delete this expense?")) {
      await api.delete(`/expense/${id}`);
      setMessage({ text: "✅ Expense deleted", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchAll();
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="container">
      {/* Main Header */}
      <div className="main-header">
        <div className="app-title">
          <h1>Expense Tracker</h1>
          <p>Track your expenses effortlessly</p>
        </div>
        <button className="profile-icon-btn" onClick={onProfileOpen}>
          <span className="profile-icon">👤</span>
        </button>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${window.location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => nav('/dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${window.location.pathname === '/logs' ? 'active' : ''}`}
          onClick={() => nav('/logs')}
        >
          Expense Logs
        </button>
        <button
          className={`tab-button ${window.location.pathname === '/audit' ? 'active' : ''}`}
          onClick={() => nav('/audit')}
        >
          Audit Logs
        </button>
      </div>

      <div className="dashboard">

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
            <h3>� Spending Trend (Last 7 Days)</h3>
            <Bar
              data={{
                // Sort dates oldest to newest and format as dd-mm-yyyy
                ...(() => {
                  const dateKeys = Object.keys(summary).sort((a, b) => new Date(a) - new Date(b));
                  return {
                    labels: dateKeys.map(date => {
                      const d = new Date(date);
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      return `${day}-${month}-${year}`;
                    }),
                    datasets: [{
                      label: "Daily Spending (₹)",
                      data: dateKeys.map(date => summary[date]),
                      backgroundColor: "#667eea",
                      barPercentage: 0.4,
                      categoryPercentage: 0.5
                    }]
                  };
                })()
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: ctx => `₹${ctx.parsed.y.toFixed(2)}`
                    }
                  }
                },
                scales: {
                  y: { beginAtZero: true, ticks: { callback: v => `₹${v}` } },
                  x: { }
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------- Audit Logs Page -----------------
function Audit({ onProfileOpen }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [filterAction, setFilterAction] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [operationCounts, setOperationCounts] = useState({ create: 0, update: 0, delete: 0 });
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'history'
  const nav = useNavigate();

  const fetchAuditLogs = async () => {
    try {
      let { data } = await api.get("/audit-logs");
      console.log("Fetched audit logs:", data); // Debug log
      setAuditLogs(data);
    } catch (error) {
      setMessage({ text: "⚠️ Failed to fetch audit logs", type: "error" });
    }
  };

  const fetchOperationCounts = async () => {
    try {
      console.log("Fetching operation counts from API...");
      let { data } = await api.get("/operation-counts");
      console.log("API response:", data);
      setOperationCounts(data);
    } catch (error) {
      console.error("API failed, calculating from audit logs:", error);
      calculateCountsFromAuditLogs();
    }
  };

  const calculateCountsFromAuditLogs = () => {
    try {
      console.log("Calculating counts from audit logs...");
      console.log("Audit logs available:", auditLogs.length);

      const counts = { create: 0, update: 0, delete: 0 };

      if (auditLogs && auditLogs.length > 0) {
        auditLogs.forEach(log => {
          console.log("Processing log:", log.action, log);
          if (counts.hasOwnProperty(log.action)) {
            counts[log.action]++;
          }
        });
      }

      console.log("Calculated counts:", counts);
      setOperationCounts(counts);
    } catch (error) {
      console.error("Failed to calculate counts from audit logs:", error);
      setOperationCounts({ create: 0, update: 0, delete: 0 });
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchOperationCounts();
  }, []);

  // Refresh audit logs when component becomes active (user navigates to audit page)
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchAuditLogs();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    return () => document.removeEventListener('visibilitychange', handleFocus);
  }, []);

  // Recalculate counts when audit logs are updated
  useEffect(() => {
    if (auditLogs.length > 0) {
      calculateCountsFromAuditLogs();
    }
  }, [auditLogs]);

  // Filter audit logs by action type and date range (for expense actions)
  const filteredLogs = auditLogs.filter(log => {
    if (log.action === 'login' || log.action === 'logout') return false;
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const logDate = new Date(log.timestamp);
    const logDateString = logDate.toISOString().split('T')[0];
    const matchesFromDate = !fromDate || logDateString >= fromDate;
    const matchesToDate = !toDate || logDateString <= toDate;
    return matchesAction && matchesFromDate && matchesToDate;
  });

  // Only login/logout actions for history tab
  const [loginHistoryDate, setLoginHistoryDate] = useState("");
  const loginLogoutLogs = auditLogs.filter(log =>
    log.action === 'login' &&
    log.description && log.description.startsWith('User logged in:') &&
    (!loginHistoryDate || new Date(log.timestamp).toISOString().split('T')[0] === loginHistoryDate)
  );

  console.log("Filtered logs:", filteredLogs); // Debug log

  const formatValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    // Format ISO date strings or Date objects as DD-MM-YYYY
    const toDDMMYYYY = (d) => {
      const dateObj = typeof d === 'string' ? new Date(d) : d;
      if (isNaN(dateObj)) return String(d);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    };
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return toDDMMYYYY(value);
    }
    if (typeof value === 'object' && value.date) {
      return toDDMMYYYY(value.date);
    }
    if (typeof value === 'number') return `₹${value.toFixed(2)}`;
    if (typeof value === 'string' && value.trim() === '') return "N/A";
    return String(value);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return 'CREATE';
      case 'update': return 'UPDATE';
      case 'delete': return 'DELETE';
      case 'login': return 'LOGIN';
      default: return 'ACTION';
    }
  };

  return (
    <div className="container">
      {/* Main Header */}
      <div className="main-header">
        <div className="app-title">
          <h1>Expense Tracker</h1>
          <p>Track your expenses effortlessly</p>
        </div>
        <button className="profile-icon-btn" onClick={onProfileOpen}>
          <span className="profile-icon">👤</span>
        </button>
      </div>

      {/* Main Navigation Tabs (Dashboard/Logs/Audit) */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${window.location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => nav('/dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${window.location.pathname === '/logs' ? 'active' : ''}`}
          onClick={() => nav('/logs')}
        >
          Expense Logs
        </button>
        <button
          className={`tab-button ${window.location.pathname === '/audit' ? 'active' : ''}`}
          onClick={() => nav('/audit')}
        >
          Audit Logs
        </button>
      </div>

      <div className="dashboard">
        {/* Main navigation (Dashboard/Logs/Audit) is above, so place audit/history switcher here */}
        <div className="tab-navigation" style={{ marginTop: 24, marginBottom: 16, justifyContent: 'center', display: 'flex', gap: '12px' }}>
          <button
            className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
            style={{ minWidth: 160 }}
          >
            Expense Audit Logs
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ minWidth: 160 }}
          >
            Login History
          </button>
        </div>

        {activeTab === 'audit' && <>
          {/* Operation Counts Boxes */}
          <div className="counts-overview">
            <div className="counts-grid-overview">
              <div className="count-card-overview create-box">
                <div className="count-info">
                  <div className="count-number">{operationCounts.create}</div>
                  <div className="count-label">Created</div>
                </div>
              </div>
              <div className="count-card-overview update-box">
                <div className="count-info">
                  <div className="count-number">{operationCounts.update}</div>
                  <div className="count-label">Updated</div>
                </div>
              </div>
              <div className="count-card-overview delete-box">
                <div className="count-info">
                  <div className="count-number">{operationCounts.delete}</div>
                  <div className="count-label">Deleted</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Filter by Action:</label>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Actions</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
              </select>
            </div>

            <div className="filter-group">
              <label>From Date:</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="filter-input"
                style={{maxWidth: "150px"}}
              />
            </div>

            <div className="filter-group">
              <label>To Date:</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="filter-input"
                style={{maxWidth: "150px"}}
              />
            </div>

            {(filterAction !== "all" || fromDate || toDate) && (
              <button
                className="btn-clear-filter"
                onClick={() => {setFilterAction("all"); setFromDate(""); setToDate("");}}>
                Clear Filters
              </button>
            )}
          </div>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          {/* Audit Logs Table */}
          <div className="audit-section">
            {filteredLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">Chart</div>
                <div className="empty-state-text">
                  {auditLogs.length === 0 ? "No audit logs yet. Start adding/editing expenses to see changes here!" : "No logs match your filter."}
                </div>
              </div>
            ) : (
              <div className="audit-table-container">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Item</th>
                      <th>Changed From</th>
                      <th>Changed To</th>
                      <th>Date</th>
                      <th>Entry Date Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log._id}>
                        <td>
                          <span className={`action-badge ${log.action}`}>
                            {getActionIcon(log.action)}
                          </span>
                        </td>
                        <td>
                          {log.action === 'create' ? (
                            <div className="expense-info-cell">
                              <div className="expense-title-cell">
                                {log.expenseId?.description || (log.changes?.newValue && typeof log.changes.newValue === 'object' ? log.changes.newValue.description : null) || 'N/A'}
                              </div>
                              <div className="expense-amount-cell">
                                {log.expenseId?.amount ? `₹${log.expenseId.amount.toFixed(2)}` : `₹${(log.changes?.oldValue && typeof log.changes.oldValue === 'object' ? log.changes.oldValue.amount : log.changes?.newValue?.amount || 0).toFixed(2)}`}
                              </div>
                            </div>
                          ) : log.action === 'update' ? (
                            <div className="field-update-info">
                              <div className="field-name">
                                {log.changes?.field || 'N/A'}
                              </div>
                              <div className="field-value">
                                {log.changes?.field === 'amount' && log.changes?.newValue ?
                                  `₹${typeof log.changes.newValue === 'number' ? log.changes.newValue.toFixed(2) : log.changes.newValue}` :
                                  formatValue(log.changes?.newValue)}
                              </div>
                            </div>
                          ) : log.action === 'delete' ? (
                            <div className="expense-info-cell">
                              <div className="expense-title-cell">
                                {log.expenseId?.description ||
                                 (log.changes?.oldValue && typeof log.changes.oldValue === 'object' ? log.changes.oldValue.description : null) ||
                                 'N/A'}
                              </div>
                              <div className="expense-amount-cell">
                                {log.expenseId?.amount ? `₹${log.expenseId.amount.toFixed(2)}` : `₹${(log.changes?.oldValue && typeof log.changes.oldValue === 'object' ? log.changes.oldValue.amount : null) || 0}.00`}
                              </div>
                            </div>
                          ) : (
                            log.changes?.field || 'N/A'
                          )}
                        </td>
                        <td>
                          <span className="change-value old-value">
                            {(log.action === 'create' || log.action === 'login') ? '-' :
                             log.changes?.field === 'all' ?
                               formatValue(log.changes?.oldValue) :
                               log.changes?.oldValue ?
                                 (typeof log.changes.oldValue === 'object' ?
                                   `${log.changes.field}: ${formatValue(log.changes.oldValue)}` :
                                   formatValue(log.changes.oldValue)) :
                                 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="change-value new-value">
                            {(log.action === 'create' || log.action === 'login') ? '-' :
                             log.changes?.field === 'all' ?
                               formatValue(log.changes?.newValue) :
                               log.changes?.newValue ?
                                 (typeof log.changes.newValue === 'object' ?
                                   `${log.changes.field}: ${formatValue(log.changes.newValue)}` :
                                   formatValue(log.changes.newValue)) :
                                 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div className="timestamp">
                            {new Date(log.timestamp).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td>
                          <div className="timestamp-time">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>}

        {activeTab === 'history' && <>
          <div className="audit-section">
            <h3 style={{margin: '16px 0'}}>Login History</h3>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label htmlFor="login-history-date" style={{ fontWeight: 500 }}>Filter by Date:</label>
              <input
                id="login-history-date"
                type="date"
                value={loginHistoryDate}
                onChange={e => setLoginHistoryDate(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}
              />
              {loginHistoryDate && (
                <button onClick={() => setLoginHistoryDate("")} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: 'none', background: '#eee', cursor: 'pointer' }}>Clear</button>
              )}
            </div>
            {loginLogoutLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👁️</div>
                <div className="empty-state-text">
                  No login or logout history yet.
                </div>
              </div>
            ) : (
              <div className="audit-table-container">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogoutLogs.map(log => (
                      <tr key={log._id}>
                        <td>
                          <span className={`action-badge ${log.action}`}>{log.action.toUpperCase()}</span>
                        </td>
                        <td>{log.description}</td>
                        <td>{new Date(log.timestamp).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}</td>
                        <td>{new Date(log.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>}
      </div>
    </div>
  );
}
// ----------------- Expense Logs Page -----------------
function Logs({ onProfileOpen }) {
  const [expenses, setExpenses] = useState([]);
  const [edit, setEdit] = useState(null);
  const [editForm, setEditForm] = useState({description:"", amount:"", date:""});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('logs');
  const nav = useNavigate();

  const fetchAll = async () => {
    try {
      let { data } = await api.get("/expense");
      setExpenses(data);
    } catch (error) {
      setMessage({ text: "⚠️ Failed to fetch expenses", type: "error" });
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

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
      setMessage({ text: "Expense updated!", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      fetchAll();
    } catch {
      setMessage({ text: "Error updating expense", type: "error" });
    }
  };

  const deleteExp = async id => {
    if(window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await api.delete(`/expense/${id}`);
        setMessage({ text: "Expense deleted", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        fetchAll();
      } catch {
        setMessage({ text: "Error deleting expense", type: "error" });
      }
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    // Filter by search term
    const matchesSearch = !searchTerm || exp.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by date
    const matchesDate = !filterDate || new Date(exp.date).toISOString().split('T')[0] === filterDate;

    return matchesSearch && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  return (
    <div className="container">
      {/* Main Header */}
      <div className="main-header">
        <div className="app-title">
          <h1>Expense Tracker</h1>
          <p>Track your expenses effortlessly</p>
        </div>
        <button className="profile-icon-btn" onClick={onProfileOpen}>
          <span className="profile-icon">👤</span>
        </button>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${window.location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => nav('/dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${window.location.pathname === '/logs' ? 'active' : ''}`}
          onClick={() => nav('/logs')}
        >
          Expense Logs
        </button>
        <button
          className={`tab-button ${window.location.pathname === '/audit' ? 'active' : ''}`}
          onClick={() => nav('/audit')}
        >
          Audit Logs
        </button>
      </div>

      <div className="dashboard">

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {/* Filters */}
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search by description..."
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

        {/* Expenses List */}
        <div className="expenses-section">
          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">Chart</div>
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
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard onProfileOpen={() => setProfileOpen(true)} /></PrivateRoute>} />
        <Route path="/logs" element={<PrivateRoute><Logs onProfileOpen={() => setProfileOpen(true)} /></PrivateRoute>} />
        <Route path="/audit" element={<PrivateRoute><Audit onProfileOpen={() => setProfileOpen(true)} /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      <Profile isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </BrowserRouter>
  );
}

export default App;
