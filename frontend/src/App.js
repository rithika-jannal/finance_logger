import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
Chart.register(LineElement, CategoryScale, LinearScale, PointElement);

// ----------------- API Setup -----------------
const api = axios.create({ baseURL: "http://localhost:5000/api" });
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
  const [message, setMessage] = useState("");
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      await api.post("/register", form);
      setMessage("✅ Registered! Redirecting to login...");
      setTimeout(() => nav("/login"), 1200);
    } catch {
      setMessage("⚠️ Email already exists");
    }
  };

  return (
    <form onSubmit={submit}>
      <h2>Register</h2>
      <input onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" required />
      <input type="email" onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required />
      <input type="password" onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" required />
      <button>Register</button>
      <div>{message}</div>

      {/* Back to Login button */}
      <p>Already have an account?</p>
      <button type="button" onClick={() => nav("/login")}>
        Back to Login
      </button>
    </form>
  );
}

// ----------------- Login -----------------
function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      let { data } = await api.post("/login", form);
      localStorage.setItem("token", data.token);
      nav("/dashboard");   // after login go to dashboard
    } catch {
      setMessage("Invalid login");
    }
  };

  return (
    <form onSubmit={submit}>
      <h2>Login</h2>
      <input
        name="email"
        onChange={e => setForm({ ...form, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        name="password"
        type="password"
        onChange={e => setForm({ ...form, password: e.target.value })}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
      <div>{message}</div>

      {/* 👇 Register button */}
      <p>Don't have an account?</p>
      <button type="button" onClick={() => nav("/register")}>
        Register
      </button>
    </form>
  );
}

// ----------------- Dashboard -----------------
function Dashboard() {
  const [expenses,setExpenses] = useState([]);
  const [edit,setEdit] = useState(null);
  const [form,setForm] = useState({description:"",amount:""});
  const [editForm,setEditForm] = useState({description:"",amount:""});
  const [message,setMessage] = useState("");
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
      setMessage("⚠️ Failed to fetch expenses");
    }
  };

  useEffect(()=>{ fetchAll(); },[]);

  const submit = async e => {
    e.preventDefault();
    try {
      await api.post("/expense", form);
      setForm({description:"",amount:""}); 
      setMessage("✅ Expense added");
      fetchAll();
    } catch { setMessage("❌ Error adding expense"); }
  };

  const startEdit = exp => {
    setEdit(exp._id);
    setEditForm({description:exp.description, amount:exp.amount});
  };
  const saveEdit = async e => {
    e.preventDefault();
    await api.put(`/expense/${edit}`, editForm);
    setEdit(null); fetchAll();
  };

  const deleteExp = async id => {
    if(window.confirm("Delete this expense?")) {
      await api.delete(`/expense/${id}`);
      fetchAll();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={logout}>Logout</button>

      <form onSubmit={submit}>
        <input onChange={e=>setForm({...form,description:e.target.value})} value={form.description} placeholder="Description" required />
        <input type="number" onChange={e=>setForm({...form,amount:+e.target.value})} value={form.amount} placeholder="Amount" required />
        <button>Add Expense</button>
      </form>
      <div>{message}</div>

      <h3>Expenses</h3>
      <ul>
        {expenses.map(exp =>
          <li key={exp._id}>
            {edit === exp._id ? (
              <form onSubmit={saveEdit}>
                <input value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} required />
                <input type="number" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:+e.target.value})} required />
                <button type="submit">Save</button>
                <button type="button" onClick={()=>setEdit(null)}>Cancel</button>
              </form>
            ) : (
              <>
                {exp.description} - ₹{exp.amount} ({new Date(exp.date).toLocaleDateString()})
                <button onClick={()=>startEdit(exp)}>Edit</button>
                <button onClick={()=>deleteExp(exp._id)}>Delete</button>
              </>
            )}
          </li>
        )}
      </ul>

      <h3>Last 7 Days Chart</h3>
      {Object.keys(summary).length > 0 &&
        <Line data={{
          labels: Object.keys(summary),
          datasets: [{
            label: "Total Spent",
            data: Object.values(summary),
            borderColor: "blue", backgroundColor: "rgba(0,0,255,0.1)"
          }]
        }} />
      }
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
