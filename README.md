# 💰 Simple Expense Tracker

A full-stack MERN (MongoDB, Express, React, Node.js) application for tracking personal expenses with user authentication, data visualization, and filtering capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Authentication
- ✅ User registration with email validation
- ✅ Secure login with JWT authentication
- ✅ Password hashing using bcrypt
- ✅ Protected routes with authentication middleware

### Expense Management
- ✅ Add new expenses with description, amount, and date
- ✅ View all expenses in a clean, organized list
- ✅ Edit existing expenses inline
- ✅ Delete expenses with confirmation
- ✅ Real-time total calculation

### Data Visualization
- ✅ Interactive line chart showing spending trends
- ✅ Last 7 days spending summary
- ✅ Responsive chart with hover tooltips
- ✅ Daily spending breakdown

### Filtering & Search
- ✅ Search expenses by description
- ✅ Filter expenses by date
- ✅ Real-time filtering as you type
- ✅ Clear filters option

### User Interface
- ✅ Modern, gradient-based design
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Smooth animations and transitions
- ✅ Success/error message notifications
- ✅ Empty state handling

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI library
- **React Router DOM** 6.14.2 - Client-side routing
- **Axios** 1.6.0 - HTTP client
- **Chart.js** 4.4.0 - Data visualization
- **React-Chartjs-2** 5.0.0 - React wrapper for Chart.js
- **CSS3** - Styling with gradients and animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** 4.18.2 - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** 7.8.7 - MongoDB ODM
- **JWT** 9.0.0 - Authentication tokens
- **bcryptjs** 2.4.3 - Password hashing
- **CORS** 2.8.5 - Cross-origin resource sharing
- **dotenv** 16.3.1 - Environment variables

## 📦 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** (optional) - For cloning the repository

Check your installations:
```bash
node --version
npm --version
mongod --version
```

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Simple-Expense-tracker.git
cd Simple-Expense-tracker
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update in backend configuration

### 5. Configure Environment Variables (Optional)

Create a `.env` file in the `backend` directory:
```env
PORT=5001
JWT_SECRET=your_super_secret_jwt_key_change_this
MONGODB_URI=mongodb://localhost:27017/Expense_Tracker
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Expense_Tracker?retryWrites=true&w=majority
```

## 🏃 Running the Application

### Start Backend Server
```bash
cd backend
npm start
```
Backend runs on: `http://localhost:5001`

### Start Frontend Development Server
```bash
cd frontend
npm start
```
Frontend runs on: `http://localhost:3000`

### Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
Simple-Expense-tracker/
├── backend/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js              # Express server & API routes
│   └── .env                   # Environment variables (create this)
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── App.css            # Styles
│   │   └── index.js           # React entry point
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
├── README.md
└── PROJECT_CREATION_PROCEDURE.md
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/register` | Register new user | ❌ |
| POST | `/api/login` | Login user | ❌ |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Expenses

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/expense` | Add new expense | ✅ |
| GET | `/api/expense` | Get all user expenses | ✅ |
| PUT | `/api/expense/:id` | Update expense | ✅ |
| DELETE | `/api/expense/:id` | Delete expense | ✅ |
| GET | `/api/expense/summary/daily` | Get 7-day summary | ✅ |

**Add Expense Request:**
```json
{
  "description": "Groceries",
  "amount": 500,
  "date": "2025-10-01"
}
```

**Authorization Header:**
```
Authorization: Bearer <your_jwt_token>
```

## 📸 Screenshots

### Login Page
Clean and modern authentication interface with gradient background.

### Dashboard
- Add new expenses with description, amount, and date
- View total spending at a glance
- Interactive line chart showing 7-day spending trend

### Expense Logs
- Complete list of all expenses
- Search by description
- Filter by date
- Inline editing
- Delete with confirmation

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5001 |
| `JWT_SECRET` | Secret key for JWT signing | 'secret' |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/Expense_Tracker |

**⚠️ Important:** Never commit `.env` file to version control. It's already in `.gitignore`.

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Register with new email
- [ ] Register with duplicate email (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Access protected routes without token (should redirect)

**Expense Management:**
- [ ] Add new expense
- [ ] View expense list
- [ ] Edit expense
- [ ] Delete expense
- [ ] View chart updates after adding expense

**Filtering:**
- [ ] Search by description
- [ ] Filter by date
- [ ] Clear filters
- [ ] View empty state

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB connection error: MongooseServerSelectionError
```
**Solution:** 
- Ensure MongoDB is running: `mongod`
- Check connection string in `server.js` or `.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5001
```
**Solution:**
```bash
# Find and kill process using port 5001
lsof -ti:5001 | xargs kill -9
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** 
- Verify CORS is enabled in `server.js`
- Check frontend is calling correct backend URL

### JWT Token Invalid
```
401 Unauthorized
```
**Solution:**
- Clear localStorage and login again
- Check token expiration (default: 1 day)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- Your Name - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- Chart.js for beautiful data visualization
- MongoDB for flexible database solution
- React team for amazing frontend library
- Express.js for simple backend framework

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

## 🔮 Future Enhancements

- [ ] Category management for expenses
- [ ] Monthly budget tracking
- [ ] Export data as CSV/PDF
- [ ] Email notifications
- [ ] Multi-currency support
- [ ] Recurring expenses
- [ ] Advanced analytics dashboard
- [ ] Dark mode toggle
- [ ] Profile management
- [ ] Password reset functionality

---

**Made with ❤️ using MERN Stack**
