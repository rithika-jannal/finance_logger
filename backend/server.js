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

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

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

// ✅ NEW: Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['LOGIN', 'LOGOUT', 'ADD_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'],
    required: true 
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

// ✅ Models
const User = mongoose.model('User', UserSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// ✅ Express App Setup
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Helper: Create Audit Log
async function createAuditLog(userId, userEmail, action, details, req) {
  try {
    const log = new AuditLog({
      userId,
      userEmail,
      action,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    await log.save();
  } catch (e) {
    console.error('Failed to create audit log:', e);
  }
}

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
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email or login.' });
    }

    let user = new User(req.body);
    await user.save();

    // Registration audit log removed as requested
    // await createAuditLog(
    //   user._id,
    //   user.email,
    //   'REGISTER',
    //   { name: user.name },
    //   req
    // );

    res.json({ message: 'Registration successful' });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(400).json({ message: e.code === 11000 ? 'Email already exists' : 'Registration failed' });
  }
});

// ✅ User Logout
app.post('/api/logout', auth, async (req, res) => {
  try {
    // Log logout
    await createAuditLog(
      req.user._id,
      req.user.email,
      'LOGOUT',
      { logoutTime: new Date() },
      req
    );

    res.json({ message: 'Logout successful' });
  } catch (e) {
    console.error('Logout error:', e);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// ✅ Add Expense
app.post('/api/expense', auth, async (req, res) => {
  let expense = new Expense({ ...req.body, user: req.user._id });
  await expense.save();

  // Log expense addition
  await createAuditLog(
    req.user._id,
    req.user.email,
    'ADD_EXPENSE',
    {
      expenseId: expense._id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date
    },
    req
  );

  res.json(expense);
});

// ✅ Get All Expenses
app.get('/api/expense', auth, async (req, res) => {
  let expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
  res.json(expenses);
});

// ✅ Edit Expense
app.put('/api/expense/:id', auth, async (req, res) => {
  // Get old expense data before update
  const oldExpense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
  
  let exp = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );

  if (exp && oldExpense) {
    // Log expense update
    await createAuditLog(
      req.user._id,
      req.user.email,
      'UPDATE_EXPENSE',
      {
        expenseId: exp._id,
        oldData: {
          description: oldExpense.description,
          amount: oldExpense.amount,
          date: oldExpense.date
        },
        newData: {
          description: exp.description,
          amount: exp.amount,
          date: exp.date
        }
      },
      req
    );
  }

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

    // Log expense deletion
    await createAuditLog(
      req.user._id,
      req.user.email,
      'DELETE_EXPENSE',
      {
        expenseId: exp._id,
        description: exp.description,
        amount: exp.amount,
        date: exp.date
      },
      req
    );

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

// ✅ NEW: Get Audit Logs
app.get('/api/audit-logs', auth, async (req, res) => {
  try {
    const { action, startDate, endDate, limit = 50 } = req.query;
    
    let query = { userId: req.user._id };
    
    // Filter by action type
    if (action && action !== 'ALL') {
      query.action = action;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(logs);
  } catch (e) {
    console.error('Error fetching audit logs:', e);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// ✅ NEW: Get Audit Stats
app.get('/api/audit-logs/stats', auth, async (req, res) => {
  try {
    const stats = await AuditLog.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
    
    const statsObj = {};
    stats.forEach(s => statsObj[s._id] = s.count);
    
    res.json(statsObj);
  } catch (e) {
    console.error('Error fetching audit stats:', e);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));
