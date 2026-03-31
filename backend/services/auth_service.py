"""
Authentication Service for AMEP
Handles user registration, login, and session management
"""

import json
import hashlib
import secrets
import os
from datetime import datetime, timedelta
from pathlib import Path

class AuthService:
    def __init__(self):
        self.users_file = Path(__file__).parent.parent / 'data' / 'users.json'
        self.sessions = {}  # In-memory session storage {token: {user_id, role, expires}}
        self._ensure_users_file()
        self.seed_demo_users()

    def seed_demo_users(self):
        """Seed demo accounts if they don't exist yet."""
        demo_accounts = [
            ('student@amep.com', 'student123', 'Demo Student', 'student'),
            ('teacher@amep.com', 'teacher123', 'Demo Teacher', 'teacher'),
        ]
        for email, password, name, role in demo_accounts:
            users_data = self._load_users()
            users_key = f"{role}s"
            exists = any(u['email'].lower() == email.lower() for u in users_data.get(users_key, []))
            if not exists:
                self.register(email, password, name, role)
    
    def _ensure_users_file(self):
        """Ensure users.json exists with proper structure."""
        if not self.users_file.exists():
            self.users_file.parent.mkdir(parents=True, exist_ok=True)
            self._save_users({'teachers': [], 'students': []})
    
    def _load_users(self):
        """Load users from JSON file."""
        try:
            with open(self.users_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {'teachers': [], 'students': []}
    
    def _save_users(self, users_data):
        """Save users to JSON file."""
        with open(self.users_file, 'w') as f:
            json.dump(users_data, f, indent=2)
    
    def _hash_password(self, password):
        """Hash password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _generate_token(self):
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)
    
    def _generate_user_id(self, role):
        """Generate unique user ID."""
        users_data = self._load_users()
        users = users_data.get(f"{role}s", [])
        if not users:
            return f"{role}_1"
        
        # Find highest ID number
        max_id = 0
        for user in users:
            try:
                id_num = int(user['id'].split('_')[1])
                max_id = max(max_id, id_num)
            except (IndexError, ValueError):
                continue
        
        return f"{role}_{max_id + 1}"
    
    def register(self, email, password, name, role='student'):
        """Register a new user."""
        if role not in ['student', 'teacher']:
            return {'success': False, 'error': 'Invalid role'}
        
        # Validate input
        if not email or not password or not name:
            return {'success': False, 'error': 'All fields are required'}
        
        if len(password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}
        
        # Load existing users
        users_data = self._load_users()
        users_key = f"{role}s"
        
        # Check if email already exists
        for user in users_data.get(users_key, []):
            if user['email'].lower() == email.lower():
                return {'success': False, 'error': 'Email already registered'}
        
        # Create new user
        user_id = self._generate_user_id(role)
        new_user = {
            'id': user_id,
            'email': email.lower(),
            'password': self._hash_password(password),
            'name': name,
            'role': role,
            'created_at': datetime.now().isoformat(),
            'last_login': None
        }
        
        # Add student-specific fields
        if role == 'student':
            new_user.update({
                'studytime': 2,
                'failures': 0,
                'absences': 0,
                'G1': 0,
                'G2': 0,
                'teacher_id': None
            })
        
        # Add teacher-specific fields
        if role == 'teacher':
            new_user.update({
                'subject': '',
                'students': []
            })
        
        # Save user
        users_data[users_key].append(new_user)
        self._save_users(users_data)
        
        return {
            'success': True,
            'user': {
                'id': user_id,
                'email': email.lower(),
                'name': name,
                'role': role
            }
        }
    
    def login(self, email, password, role='student'):
        """Authenticate user and create session."""
        if role not in ['student', 'teacher']:
            return {'success': False, 'error': 'Invalid role'}
        
        # Load users
        users_data = self._load_users()
        users_key = f"{role}s"
        
        # Find user
        user = None
        for u in users_data.get(users_key, []):
            if u['email'].lower() == email.lower():
                user = u
                break
        
        if not user:
            return {'success': False, 'error': 'Invalid email or password'}
        
        # Verify password
        if user['password'] != self._hash_password(password):
            return {'success': False, 'error': 'Invalid email or password'}
        
        # Generate token
        token = self._generate_token()
        
        # Create session (expires in 24 hours)
        self.sessions[token] = {
            'user_id': user['id'],
            'role': role,
            'expires': datetime.now() + timedelta(hours=24)
        }
        
        # Update last login
        user['last_login'] = datetime.now().isoformat()
        self._save_users(users_data)
        
        # Return user data (without password)
        user_data = {k: v for k, v in user.items() if k != 'password'}
        
        return {
            'success': True,
            'token': token,
            'user': user_data
        }
    
    def validate_token(self, token):
        """Validate session token."""
        if not token or token not in self.sessions:
            return {'valid': False, 'error': 'Invalid token'}
        
        session = self.sessions[token]
        
        # Check if expired
        if datetime.now() > session['expires']:
            del self.sessions[token]
            return {'valid': False, 'error': 'Token expired'}
        
        # Get user data
        users_data = self._load_users()
        users_key = f"{session['role']}s"
        
        user = None
        for u in users_data.get(users_key, []):
            if u['id'] == session['user_id']:
                user = u
                break
        
        if not user:
            return {'valid': False, 'error': 'User not found'}
        
        # Return user data (without password)
        user_data = {k: v for k, v in user.items() if k != 'password'}
        
        return {
            'valid': True,
            'user': user_data
        }
    
    def logout(self, token):
        """Invalidate session token."""
        if token in self.sessions:
            del self.sessions[token]
        return {'success': True}
    
    def get_user(self, user_id, role):
        """Get user by ID and role."""
        users_data = self._load_users()
        users_key = f"{role}s"
        
        for user in users_data.get(users_key, []):
            if user['id'] == user_id:
                # Return without password
                return {k: v for k, v in user.items() if k != 'password'}
        
        return None
    
    def update_user(self, user_id, role, updates):
        """Update user data."""
        users_data = self._load_users()
        users_key = f"{role}s"
        
        for i, user in enumerate(users_data.get(users_key, [])):
            if user['id'] == user_id:
                # Don't allow updating email or password through this method
                allowed_updates = {k: v for k, v in updates.items() 
                                 if k not in ['id', 'email', 'password', 'created_at']}
                users_data[users_key][i].update(allowed_updates)
                self._save_users(users_data)
                
                # Return updated user (without password)
                return {k: v for k, v in users_data[users_key][i].items() if k != 'password'}
        
        return None
