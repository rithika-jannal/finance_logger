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

// ✅ Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  action: { type: String, enum: ['create', 'update', 'delete', 'login'], required: true },
  changes: {
    field: { type: String },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed }
  },
  timestamp: { type: Date, default: Date.now },
  description: String
});

// ✅ Models
const User = mongoose.model('User', UserSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// ✅ Express App Setup
const app = express();
app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }

  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    User.findById(decoded.id).then(user => {
      if (!user) {
        return res.sendStatus(401);
      }
      req.user = user;
      next();
    }).catch(err => {
      console.error("Auth error finding user:", err);
      res.sendStatus(401);
    });
  } catch (error) {
    console.error("Auth error verifying token:", error);
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.code === 11000 ? 'Email already exists' : 'Registration failed' });
  }
});

// ✅ User Login
app.post('/api/login', async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user || !user.matchPassword(req.body.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

  // Create audit log for login
  const auditLog = new AuditLog({
    user: user._id,
    action: 'login',
    description: `User logged in: ${user.email}`
  });
  await auditLog.save();

  res.json({ token });
});

// ✅ Add Expense
app.post('/api/expense', auth, async (req, res) => {
  let expense = new Expense({ ...req.body, user: req.user._id });
  await expense.save();

  // Create audit log for creation
  const auditLog = new AuditLog({
    user: req.user._id,
    expenseId: expense._id,
    action: 'create',
    changes: {
      field: 'all',
      oldValue: null,
      newValue: { description: expense.description, amount: expense.amount, date: expense.date }
    },
    description: `Created new expense: "${expense.description}" (₹${expense.amount})`
  });
  await auditLog.save();

  res.json(expense);
});

// ✅ Get All Expenses
app.get('/api/expense', auth, async (req, res) => {
  let expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
  res.json(expenses);
});

// ✅ Edit Expense
app.put('/api/expense/:id', auth, async (req, res) => {
  try {
    // Get the original expense before updating
    const originalExpense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!originalExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Update the expense
    let updatedExpense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    // Create audit logs for each changed field
    const fieldsToCheck = ['description', 'amount', 'date'];

    for (const field of fieldsToCheck) {
      const oldValue = originalExpense[field];
      const newValue = updatedExpense[field];

      // Only create audit log if the field was actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        const auditLog = new AuditLog({
          user: req.user._id,
          expenseId: req.params.id,
          action: 'update',
          changes: {
            field: field,
            oldValue: oldValue,
            newValue: newValue
          },
          description: `Updated ${field} from "${oldValue}" to "${newValue}"`
        });
        await auditLog.save();
      }
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Error updating expense' });
  }
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

    // Create audit log for deletion with expense info included
    const auditLog = new AuditLog({
      user: req.user._id,
      expenseId: req.params.id,
      action: 'delete',
      changes: {
        field: 'all',
        oldValue: { description: exp.description, amount: exp.amount, date: exp.date },
        newValue: null
      },
      description: `Deleted expense: "${exp.description}" (₹${exp.amount})`
    });
    await auditLog.save();

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
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
    date: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) }
  }).select('description amount date');

  res.json(expenses);
});

// ✅ Get Operation Counts
app.get('/api/operation-counts', auth, async (req, res) => {
  try {
    const counts = await AuditLog.aggregate([
      { $match: { user: req.user._id, action: { $ne: 'login' } } }, // Exclude login actions
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log("Aggregation result:", counts); // Debug log

    // Convert to the format expected by frontend
    const result = {
      create: 0,
      update: 0,
      delete: 0
    };

    counts.forEach(item => {
      if (result.hasOwnProperty(item._id)) {
        result[item._id] = item.count;
      }
    });

    console.log("Final result:", result); // Debug log
    res.json(result);
  } catch (error) {
    console.error('Error fetching operation counts:', error);
    res.status(500).json({ message: 'Error fetching operation counts' });
  }
});

// ✅ Create Audit Log (for frontend)
app.post('/api/audit-logs', auth, async (req, res) => {
  try {
    const auditLog = new AuditLog({
      user: req.user._id,
      action: req.body.action,
      description: req.body.description,
      timestamp: new Date()
    });
    await auditLog.save();
    res.json({ message: 'Audit log created successfully' });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ message: 'Error creating audit log' });
  }
});

// ✅ Get Audit Logs
app.get('/api/audit-logs', auth, async (req, res) => {
  try {
    console.log("Fetching audit logs for user:", req.user._id); // Debug log

    const auditLogs = await AuditLog.find({ user: req.user._id })
      .populate('expenseId', 'description amount date')
      .populate('user', 'name email')
      .sort({ timestamp: -1 });

    console.log("Found audit logs:", auditLogs.length); // Debug log
    console.log("Sample audit log:", auditLogs[0]); // Debug log

    res.json(auditLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// ✅ Get User Profile
app.get('/api/user-profile', auth, async (req, res) => {
  try {
    console.log("User profile request for user:", req.user._id); // Debug log
    const user = await User.findById(req.user._id).select('name email');
    console.log("Found user:", user); // Debug log
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// ✅ Change Password
app.put('/api/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const user = await User.findById(req.user._id);
    if (!user.matchPassword(currentPassword)) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password directly in the database to avoid double hashing
    await User.findByIdAndUpdate(
      req.user._id,
      { password: hashedPassword },
      { new: true }
    );

    // Note: Not creating audit log for password changes for security reasons

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));
