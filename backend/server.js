const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/expense', { useNewUrlParser: true });

const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String
});
UserSchema.pre('save', async function(next){
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10); next();
});
UserSchema.methods.matchPassword = function(pw) { return bcrypt.compareSync(pw, this.password); };

const ExpenseSchema = new mongoose.Schema({
  description: String, amount: Number, date: {type: Date, default: Date.now}, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', UserSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);

const app = express(); app.use(cors()); app.use(express.json());

function auth(req, res, next) {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    User.findById(decoded.id).then(user => {req.user = user; next();});
  } catch { res.sendStatus(401); }
}

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    let user = new User(req.body); await user.save();
    res.json({ message: 'Registration successful' });
  } catch (e) { res.status(400).json({ message: 'Email exists' }); }
});

// User Login
app.post('/api/login', async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user || !user.matchPassword(req.body.password))
    return res.status(401).json({ message: 'Invalid credentials' });
  let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
  res.json({ token });
});

// Add expense
app.post('/api/expense', auth, async (req, res) => {
  let expense = new Expense({ ...req.body, user: req.user._id });
  await expense.save(); res.json(expense);
});

// Get all user's expenses
app.get('/api/expense', auth, async (req, res) => {
  let expenses = await Expense.find({ user: req.user._id }).sort({date:-1});
  res.json(expenses);
});

// Edit expense
app.put('/api/expense/:id', auth, async (req, res) => {
  let exp = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body, { new: true }
  );
  res.json(exp || {});
});

// Daily summary for chart
app.get('/api/expense/summary/daily', auth, async (req, res) => {
  const today = new Date();
  let days = [];
  for (let i = 6; i >= 0; i--) {
    let d = new Date(today); d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  let expenses = await Expense.find({ user: req.user._id, date: { $gte: new Date(Date.now()-6*24*3600*1000) } });
  let dailyTotals = {};
  days.forEach(day => dailyTotals[day]=0);
  expenses.forEach(e=>{
    let day = e.date.toISOString().slice(0,10);
    if(dailyTotals[day] !== undefined) dailyTotals[day] += e.amount;
  });
  res.json(dailyTotals);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server started', PORT));
