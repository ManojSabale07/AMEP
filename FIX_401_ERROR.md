# 🔧 FIX FOR 401 UNAUTHORIZED ERROR

## The Problem
You're getting a 401 error because you're trying to **LOGIN** with credentials that don't exist yet!

You need to either:
1. **REGISTER** a new account first (click "Sign Up" tab), OR
2. Use pre-created test accounts

---

## ✅ SOLUTION: Create Test Users

### Option 1: Run the Test User Script (Recommended)

1. **Stop the backend server** (Ctrl+C in the terminal)

2. **Create test users:**
```bash
cd D:\Hackathon\HACKVOIUM\AMEP\backend
python create_test_users.py
```

3. **Restart the backend:**
```bash
python app.py
```

4. **Now login with these accounts:**

**Student Account:**
- Email: `student@test.com`
- Password: `student123`
- Role: Student

**Teacher Account:**
- Email: `teacher@test.com`  
- Password: `teacher123`
- Role: Teacher

---

### Option 2: Register Through the UI

1. Go to http://localhost:5173
2. Click the **"Sign Up"** tab (not "Sign In")
3. Fill in:
   - Select role: Student or Teacher
   - Full Name: Your Name
   - Email: youremail@example.com
   - Password: (at least 6 characters)
   - Confirm Password: (same password)
4. Click **"Create Account"**
5. You'll be automatically logged in!

---

## 🔍 Why This Happens

The error happens because:
1. You're clicking "Sign In" 
2. But no user account exists yet in the database
3. The backend returns: "Invalid email or password" (401 error)

**Solution:** Create an account first using "Sign Up"!

---

## 📋 Step-by-Step Fix

### Step 1: Stop Backend
Press `Ctrl+C` in the terminal running the backend

### Step 2: Create Test Users
```bash
cd D:\Hackathon\HACKVOIUM\AMEP\backend
python create_test_users.py
```

You should see:
```
====================================
Creating Test Users for AMEP
====================================

1. Creating test student...
   ✅ Student created successfully!
   Email: student@test.com
   Password: student123
   ID: student_1

2. Creating test teacher...
   ✅ Teacher created successfully!
   Email: teacher@test.com
   Password: teacher123
   ID: teacher_1

...

✅ Setup complete! Go to http://localhost:5173 and login!
```

### Step 3: Restart Backend
```bash
python app.py
```

### Step 4: Login
1. Go to http://localhost:5173
2. Make sure you're on **"Sign In"** tab
3. Select role: **Student**
4. Enter:
   - Email: `student@test.com`
   - Password: `student123`
5. Click **"Sign In"**
6. ✅ You should now be logged in!

---

## 🎯 Testing Both Roles

### Test as Student:
- Email: `student@test.com`
- Password: `student123`
- Role: Student

### Test as Teacher:
- Email: `teacher@test.com`
- Password: `teacher123`
- Role: Teacher

---

## 🐛 Still Not Working?

### Check Backend Logs
Look at the terminal where the backend is running. You should see:
```
INFO - Login attempt: email=student@test.com, role=student
INFO - Login successful for student@test.com
```

If you see:
```
WARNING - Login failed for student@test.com: Invalid email or password
```

Then the user doesn't exist. Run `create_test_users.py` again.

### Check Browser Console
In the browser, check the error message. It should now show the actual error:
- "Invalid email or password" = User doesn't exist or wrong password
- "Invalid role" = Make sure role matches (student/teacher)

### Check Database
The users are stored in: `D:\Hackathon\HACKVOIUM\AMEP\backend\data\users.json`

Open this file to see all registered users.

---

## 💡 Quick Test

Run this in the backend directory to verify everything works:
```bash
python test_services.py
```

This will test all services including authentication.

---

## ✨ After Login

Once logged in successfully, you'll be redirected to:
- **Students:** `/student` dashboard
- **Teachers:** `/teacher` dashboard

---

## 🎉 Summary

The fix is simple:
1. Run `python create_test_users.py`
2. Restart backend with `python app.py`
3. Login with `student@test.com` / `student123`
4. Done! ✅

OR just use the **"Sign Up"** tab to create your own account!
