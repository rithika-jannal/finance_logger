const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

// ✅ Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Expense_Tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB (Expense_Tracker)"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password
UserSchema.methods.matchPassword = function (pw) {
  return bcrypt.compareSync(pw, this.password);
};

// ✅ Expense Schema
const ExpenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// ✅ Models
const User = mongoose.model('User', UserSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);

// ✅ Express App Setup
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Middleware: Auth
function auth(req, res, next) {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    User.findById(decoded.id).then(user => {
      if (!user) return res.sendStatus(401);
      req.user = user;
      next();
    });
  } catch {
    res.sendStatus(401);
  }
}

// ✅ User Registration
app.post('/api/register', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email or login.' });
    }
    
    let user = new User(req.body);
    await user.save();
    res.json({ message: 'Registration successful' });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(400).json({ message: e.code === 11000 ? 'Email already exists' : 'Registration failed' });
  }
});

// ✅ User Login
// ✅ User Login
app.post('/api/login', async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user || !user.matchPassword(req.body.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  let token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});


// ✅ Add Expense
app.post('/api/expense', auth, async (req, res) => {
  let expense = new Expense({ ...req.body, user: req.user._id });
  await expense.save();
  res.json(expense);
});

// ✅ Get All Expenses
app.get('/api/expense', auth, async (req, res) => {
  let expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
  res.json(expenses);
});

// ✅ Edit Expense
app.put('/api/expense/:id', auth, async (req, res) => {
  let exp = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );
  res.json(exp || {});
});

// ✅ Delete Expense
app.delete('/api/expense/:id', auth, async (req, res) => {
  try {
    let exp = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!exp) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

// ✅ Daily Summary (for charts)
app.get('/api/expense/summary/daily', auth, async (req, res) => {
  const today = new Date();
  let days = [];

  for (let i = 6; i >= 0; i--) {
    let d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  let expenses = await Expense.find({
    user: req.user._id,
    date: { $gte: new Date(Date.now() - 6 * 24 * 3600 * 1000) }
  });

  let dailyTotals = {};
  days.forEach(day => dailyTotals[day] = 0);

  expenses.forEach(e => {
    let day = e.date.toISOString().slice(0, 10);
    if (dailyTotals[day] !== undefined) {
      dailyTotals[day] += e.amount;
    }
  });

  res.json(dailyTotals);
});

// ✅ Get User Profile
app.get('/api/profile', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    });
  } catch (e) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// ✅ Update User Profile (except password)
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Prevent duplicate emails
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already taken' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name: name || req.user.name, email: email || req.user.email },
      { new: true }
    );

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email
    });
  } catch (e) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// ✅ Change Password
app.put('/api/profile/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Check old password
    if (!req.user.matchPassword(oldPassword)) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Update password (bcrypt will hash because of pre('save'))
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Error updating password' });
  }
});


// ✅ Root route: Redirect to frontend login
app.get('/', (req, res) => {
  res.redirect('http://localhost:3000/login');
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));
