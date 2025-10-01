# Complete Procedure to Create Simple Expense Tracker

## Project Overview
A full-stack MERN (MongoDB, Express, React, Node.js) expense tracking application with user authentication, CRUD operations, data visualization, and filtering capabilities.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure Setup](#project-structure-setup)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Running the Application](#running-the-application)
6. [Features Implemented](#features-implemented)

---

## Prerequisites

### Required Software
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas)
- **Code Editor** (VS Code recommended)

### Check Installations
```bash
node --version
npm --version
mongod --version
```

---

## Project Structure Setup

### Step 1: Create Project Directory
```bash
mkdir Simple-Expense-tracker
cd Simple-Expense-tracker
```

### Step 2: Initialize Git Repository
```bash
git init
```

### Step 3: Create .gitignore File
```bash
touch .gitignore
```

Add the following content:
```
# Node.js
node_modules/
npm-debug.log

# Python / Backend
__pycache__/
*.pyc
venv/
.env

# Others
.DS_Store
```

### Step 4: Create README.md
```bash
echo "# Simple-Expense-Tracker" > README.md
```

---

## Backend Development

### Step 1: Create Backend Directory
```bash
mkdir backend
cd backend
```

### Step 2: Initialize Node.js Project
```bash
npm init -y
```

### Step 3: Install Backend Dependencies
```bash
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
```

**Dependencies Explanation:**
- **express**: Web framework for Node.js
- **mongoose**: MongoDB object modeling tool
- **bcryptjs**: Password hashing library
- **jsonwebtoken**: JWT authentication
- **cors**: Enable Cross-Origin Resource Sharing
- **dotenv**: Environment variable management

### Step 4: Create server.js
```bash
touch server.js
```

### Step 5: Implement Backend Code

**server.js** includes:

#### 5.1 Import Dependencies
```javascript
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
```

#### 5.2 MongoDB Connection
```javascript
mongoose.connect('mongodb://localhost:27017/Expense_Tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
```

#### 5.3 Define Schemas
- **User Schema**: name, email (unique), password
- **Expense Schema**: description, amount, date, user (reference)

#### 5.4 Implement Middleware
- **Authentication Middleware**: Verify JWT tokens
- **CORS**: Enable cross-origin requests
- **JSON Parser**: Parse JSON request bodies

#### 5.5 Create API Endpoints
- `POST /api/register` - User registration with password hashing
- `POST /api/login` - User login with JWT token generation
- `POST /api/expense` - Add new expense (protected)
- `GET /api/expense` - Get all user expenses (protected)
- `PUT /api/expense/:id` - Update expense (protected)
- `DELETE /api/expense/:id` - Delete expense (protected)
- `GET /api/expense/summary/daily` - Get daily spending summary (protected)

#### 5.6 Configure Server
```javascript
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
```

### Step 6: Update package.json Scripts
```json
"scripts": {
  "start": "node server.js"
}
```

---

## Frontend Development

### Step 1: Create Frontend Directory
```bash
cd ..
npx create-react-app frontend
cd frontend
```

### Step 2: Install Frontend Dependencies
```bash
npm install axios react-router-dom chart.js react-chartjs-2
```

**Dependencies Explanation:**
- **axios**: HTTP client for API requests
- **react-router-dom**: Routing library for React
- **chart.js**: JavaScript charting library
- **react-chartjs-2**: React wrapper for Chart.js

### Step 3: Clean Up Default Files
```bash
# Remove unnecessary files
rm src/App.test.js src/logo.svg src/reportWebVitals.js src/setupTests.js
```

### Step 4: Update public/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Simple Expense Tracker</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### Step 5: Create src/index.js
```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
```

### Step 6: Implement src/App.js

#### 6.1 Import Dependencies
```javascript
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler } from "chart.js";
```

#### 6.2 Configure Axios
```javascript
const api = axios.create({ baseURL: "http://localhost:5001/api" });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});
```

#### 6.3 Create Components
1. **PrivateRoute**: Route guard for authenticated routes
2. **Register**: User registration form
3. **Login**: User login form
4. **Dashboard**: Main expense management interface with chart
5. **Logs**: Expense list with filtering and editing capabilities

#### 6.4 Implement Features
- Form validation
- JWT token storage in localStorage
- API error handling
- Success/error messages
- Real-time data updates
- Chart visualization using Chart.js
- Search and filter functionality
- CRUD operations (Create, Read, Update, Delete)

#### 6.5 Setup Routing
```javascript
<BrowserRouter>
  <Routes>
    <Route path="/register" element={<Register />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
    <Route path="/" element={<Navigate to="/login" />} />
  </Routes>
</BrowserRouter>
```

### Step 7: Create src/App.css

#### 7.1 Global Styles
- Reset CSS (margin, padding, box-sizing)
- Body gradient background
- Font family: Segoe UI

#### 7.2 Component Styles
1. **Auth Forms**
   - Centered card layout
   - Gradient background
   - Form inputs with focus states
   - Primary and secondary buttons
   - Success/error messages

2. **Dashboard**
   - White card with shadow
   - Header with navigation
   - Expense form with grid layout
   - Chart section with styling
   - Expense list with hover effects

3. **Buttons**
   - Primary (gradient)
   - Secondary (outlined)
   - Edit (yellow)
   - Delete (red)
   - Save (green)
   - Cancel (gray)

4. **Responsive Design**
   - Media queries for mobile devices
   - Flexible grid layouts
   - Stacked forms on small screens

#### 7.3 Animations
- Slide-in animation for auth cards
- Fade-in animation for messages
- Hover effects on buttons and cards
- Chart animation with easing

### Step 8: Update package.json Scripts
```json
"scripts": {
  "start": "react-scripts start"
}
```

---

## Running the Application

### Step 1: Start MongoDB
```bash
# If using local MongoDB
mongod
```

### Step 2: Start Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:5001
```

### Step 3: Start Frontend Development Server
```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

### Step 4: Access Application
Open browser and navigate to: `http://localhost:3000`

---

## Features Implemented

### 1. User Authentication
- **Registration**: Create new account with name, email, password
- **Login**: Authenticate with email and password
- **JWT Tokens**: Secure authentication using JSON Web Tokens
- **Password Hashing**: bcrypt for secure password storage
- **Protected Routes**: Route guards for authenticated pages

### 2. Expense Management
- **Add Expense**: Description, amount, and date
- **View Expenses**: List all expenses with details
- **Edit Expense**: Update existing expense information
- **Delete Expense**: Remove expenses with confirmation
- **Real-time Updates**: Automatic refresh after operations

### 3. Data Visualization
- **Line Chart**: Daily spending trend for last 7 days
- **Interactive Tooltips**: Hover to see detailed information
- **Responsive Chart**: Adapts to screen size
- **Gradient Fill**: Visual appeal with colored areas

### 4. Filtering & Search
- **Search by Description**: Text-based filtering
- **Filter by Date**: Date picker for specific dates
- **Clear Filters**: Reset all filters
- **Real-time Filtering**: Instant results

### 5. User Interface
- **Modern Design**: Gradient backgrounds and shadows
- **Responsive Layout**: Mobile-friendly design
- **Smooth Animations**: Transitions and hover effects
- **Success/Error Messages**: User feedback for actions
- **Empty States**: Helpful messages when no data

### 6. Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Protected API Routes**: Middleware authentication
- **Input Validation**: Required fields and type checking
- **Duplicate Email Prevention**: Unique email constraint

### 7. Database Design
- **User Collection**: Stores user credentials
- **Expense Collection**: Stores expenses with user reference
- **Indexes**: Unique email index for performance
- **Relationships**: One-to-many (User to Expenses)

---

## Technology Stack Summary

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT + bcryptjs
- **Middleware**: CORS, express.json()

### Frontend
- **Library**: React 18
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Charts**: Chart.js + react-chartjs-2
- **Styling**: Pure CSS with gradients
- **State Management**: React Hooks (useState, useEffect)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Editor**: VS Code (recommended)

---

## API Endpoints Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /api/register | No | Register new user |
| POST | /api/login | No | Login user |
| POST | /api/expense | Yes | Add new expense |
| GET | /api/expense | Yes | Get all user expenses |
| PUT | /api/expense/:id | Yes | Update expense |
| DELETE | /api/expense/:id | Yes | Delete expense |
| GET | /api/expense/summary/daily | Yes | Get daily summary |

---

## Environment Variables

Create a `.env` file in the backend directory:
```
PORT=5001
JWT_SECRET=your_secret_key_here
MONGODB_URI=mongodb://localhost:27017/Expense_Tracker
```

---

## Project File Structure

```
Simple-Expense-tracker/
├── backend/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── frontend/
│   ├── node_modules/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.css
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

---

## Development Best Practices Used

1. **Separation of Concerns**: Backend and frontend in separate directories
2. **Component-Based Architecture**: Reusable React components
3. **RESTful API Design**: Standard HTTP methods and endpoints
4. **Error Handling**: Try-catch blocks and error messages
5. **Code Organization**: Logical file structure
6. **Security**: Password hashing, JWT tokens, protected routes
7. **User Experience**: Loading states, success/error feedback
8. **Responsive Design**: Mobile-first approach
9. **Version Control**: Git for code management
10. **Documentation**: Clear comments and README

---

## Future Enhancements (Optional)

1. **Category Management**: Add expense categories
2. **Budget Tracking**: Set monthly budgets
3. **Export Data**: Download expenses as CSV/PDF
4. **Email Notifications**: Alerts for budget limits
5. **Multi-currency Support**: Different currencies
6. **Recurring Expenses**: Automatic expense entries
7. **Data Analytics**: Advanced charts and insights
8. **Dark Mode**: Theme toggle
9. **Profile Management**: Update user information
10. **Password Reset**: Forgot password functionality

---

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in server.js

2. **CORS Error**
   - Verify CORS is enabled in backend
   - Check API base URL in frontend

3. **Port Already in Use**
   - Change PORT in .env file
   - Kill process using the port

4. **JWT Token Invalid**
   - Clear localStorage
   - Re-login to get new token

5. **Dependencies Not Found**
   - Run `npm install` in both directories
   - Delete node_modules and reinstall

---

## Conclusion

This expense tracker application demonstrates a complete full-stack development workflow using the MERN stack. It includes authentication, CRUD operations, data visualization, and modern UI/UX design principles. The modular structure makes it easy to extend with additional features.
