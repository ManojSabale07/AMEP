# AMEP - Quick Start Guide

## 🚀 Starting the Application

### Step 1: Start the Backend Server

Open a terminal/command prompt and run:

```bash
cd D:\Hackathon\HACKVOIUM\AMEP\backend
python app.py
```

Or simply double-click: `start-backend.bat`

The backend will start on **http://localhost:8000**

You should see:
```
==================================================
Starting AMEP Backend Server v3.0
==================================================
Endpoints:
  Auth:       POST /auth/login
  Predict:    POST /predict
  Students:   GET/POST /students
  Analytics:  GET /class-analytics
  Health:     GET /health
==================================================
 * Running on http://0.0.0.0:8000
```

### Step 2: Start the Frontend

Open another terminal and run:

```bash
cd D:\Hackathon\HACKVOIUM\AMEP\frontend-react
npm run dev
```

The frontend will start on **http://localhost:5173**

### Step 3: Access the Application

1. Open your browser and go to: **http://localhost:5173**
2. You'll see the beautiful animated login page
3. Click **Sign Up** tab to create an account
4. Select your role (Student or Teacher)
5. Fill in your details:
   - Full Name: Your Name
   - Email: your.email@example.com
   - Password: (at least 6 characters)
6. Click **Create Account**
7. You'll be automatically logged in!

## 🔐 Test Accounts

You can create accounts with any email/password. For testing:

**Student Account:**
- Email: student@test.com
- Password: student123
- Role: Student

**Teacher Account:**
- Email: teacher@test.com
- Password: teacher123
- Role: Teacher

## 🐛 Troubleshooting

### Backend won't start?

**Check Python installation:**
```bash
python --version
```
Should show Python 3.8 or higher.

**Install dependencies:**
```bash
cd D:\Hackathon\HACKVOIUM\AMEP\backend
pip install -r requirements.txt
```

**Test backend services:**
```bash
cd D:\Hackathon\HACKVOIUM\AMEP\backend
python test_services.py
```

### Frontend shows "Network Error"?

1. Make sure the backend is running on port 8000
2. Check the console - you should see the backend URL
3. Test backend health: Open http://localhost:8000/health in your browser
4. Should return: `{"status": "healthy", ...}`

### Port already in use?

**Backend (8000):**
Edit `backend/app.py`, line 408:
```python
app.run(host='0.0.0.0', port=8001, debug=True)  # Changed to 8001
```

Then update frontend `.env`:
```
VITE_API_URL=http://localhost:8001
```

**Frontend (5173):**
It will automatically use the next available port (5174, 5175, etc.)

## 📋 Available Endpoints

### Public Endpoints
- `GET /health` - Server health check

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token
- `POST /auth/logout` - Logout (requires auth)
- `GET /auth/validate` - Validate token
- `GET /auth/me` - Get current user info

### Student Endpoints
- `GET /student/profile` - Get student profile & prediction
- `PUT /student/profile` - Update student data

### Teacher Endpoints
- `GET /students` - Get all students
- `POST /add-student` - Add new student
- `PUT /students/<id>` - Update student
- `DELETE /students/<id>` - Delete student
- `GET /class-analytics` - Class statistics

### Prediction Endpoints
- `POST /predict` - Full prediction
- `POST /predict-mastery` - Mastery only
- `POST /predict-performance` - Performance only

## 🎨 Features Implemented

✅ **Authentication System**
- Registration with email/password
- Secure login with session tokens
- Password strength indicator
- Role-based access (Student/Teacher)
- Persistent sessions

✅ **Professional UI**
- Animated gradient backgrounds
- Smooth transitions and hover effects
- Dark mode support
- Responsive design
- Modern glassmorphism styling

✅ **Backend Security**
- Password hashing (SHA-256)
- JWT-like token system
- Protected endpoints
- Role-based authorization
- Centralized user database

## 📊 Next Steps

After logging in:

**As a Student:**
- View your performance predictions
- Get personalized learning recommendations
- Track your progress
- Update your academic data

**As a Teacher:**
- View all students and their predictions
- See class-level analytics
- Identify at-risk students
- Get teaching recommendations

## 🆘 Need Help?

If you encounter any issues:
1. Check both terminal windows for error messages
2. Verify both servers are running
3. Clear browser cache and localStorage
4. Try the test script: `python test_services.py`

Enjoy using AMEP! 🎓
