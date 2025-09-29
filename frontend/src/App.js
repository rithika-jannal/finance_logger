import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
Chart.register(LineElement, CategoryScale, LinearScale, PointElement);

const api = axios.create({ baseURL: "http://localhost:5000/api" });
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
  const [message, setMessage] = useState("");
  const nav = useNavigate();
  const submit = async e => {
    e.preventDefault();
    try {
      await api.post("/register", form);
      setMessage("Registered! Login.");
      setTimeout(() => nav("/login"), 1000);
    } catch { setMessage("Email exists"); }
  };
  return (
    <form onSubmit={submit}>
      <h2>Register</h2>
      <input name="name" onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" required />
      <input name="email" type="email" onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" required />
      <input name="password" type="password" onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" required />
      <button>Register</button>
      <div>{message}</div>
    </form>
  );
}

function Login() {
  const [form,setForm] = useState({email: "", password: ""});
  const [message,setMessage] = useState("");
  const nav = useNavigate();
  const submit = async e => {
    e.preventDefault();
    try {
      let { data } = await api.post("/login", form);
      localStorage.setItem("token", data.token);
      nav("/");
    } catch { setMessage("Invalid login"); }
  };
  return (
    <form onSubmit={submit}>
      <h2>Login</h2>
      <input name="email" onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" required />
      <input name="password" type="password" onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password" required />
      <button>Login</button>
      <div>{message}</div>
    </form>
  );
}

function Dashboard() {
  const [expenses,setExpenses] = useState([]);
  const [edit,setEdit] = useState(null);
  const [form,setForm] = useState({description:"",amount:""});
  const [editForm,setEditForm] = useState({description:"",amount:""});
  const [message,setMessage] = useState("");
  const [summary,setSummary] = useState({});
  
  const fetchAll = async () => {
    let { data } = await api.get("/expense");
    setExpenses(data);
    let sum = await api.get("/expense/summary/daily");
    setSummary(sum.data);
  };
  useEffect(()=>{ fetchAll(); },[]);
  
  const submit = async e => {
    e.preventDefault();
    try {
      await api.post("/expense", form);
      setForm({description:"",amount:""}); setMessage("Added");
      fetchAll();
    } catch { setMessage("Error"); }
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
  return (
    <div>
      <h2>Dashboard</h2>
      <form onSubmit={submit}>
        <input name="description" onChange={e=>setForm({...form,description:e.target.value})} value={form.description} placeholder="Description" required />
        <input name="amount" type="number" onChange={e=>setForm({...form,amount:e.target.value})} value={form.amount} placeholder="Amount" required />
        <button>Add Expense</button>
        <div>{message}</div>
      </form>
      <h3>Expenses</h3>
      <ul>
        {expenses.map(exp =>
          <li key={exp._id}>
            {edit === exp._id ?
              <form onSubmit={saveEdit}>
                <input name="description" value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})} required />
                <input name="amount" type="number" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:e.target.value})} required />
                <button type="submit">Save</button>
                <button type="button" onClick={()=>setEdit(null)}>Cancel</button>
              </form>
              :
              <>
                {exp.description} - ₹{exp.amount} ({new Date(exp.date).toLocaleDateString()})
                <button onClick={()=>startEdit(exp)}>Edit</button>
              </>
            }
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
