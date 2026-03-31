"""
Create test users for AMEP
Run this to create default student and teacher accounts
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.auth_service import AuthService

print("=" * 60)
print("Creating Test Users for AMEP")
print("=" * 60)

auth_service = AuthService()

# Create test student
print("\n1. Creating test student...")
result = auth_service.register(
    email="student@test.com",
    password="student123",
    name="Test Student",
    role="student"
)
if result['success']:
    print("   ✅ Student created successfully!")
    print(f"   Email: student@test.com")
    print(f"   Password: student123")
    print(f"   ID: {result['user']['id']}")
else:
    print(f"   ℹ️  {result.get('error', 'Unknown error')}")

# Create test teacher
print("\n2. Creating test teacher...")
result = auth_service.register(
    email="teacher@test.com",
    password="teacher123",
    name="Test Teacher",
    role="teacher"
)
if result['success']:
    print("   ✅ Teacher created successfully!")
    print(f"   Email: teacher@test.com")
    print(f"   Password: teacher123")
    print(f"   ID: {result['user']['id']}")
else:
    print(f"   ℹ️  {result.get('error', 'Unknown error')}")

# Create another student
print("\n3. Creating another student...")
result = auth_service.register(
    email="john.doe@student.com",
    password="password123",
    name="John Doe",
    role="student"
)
if result['success']:
    print("   ✅ Student created successfully!")
    print(f"   Email: john.doe@student.com")
    print(f"   Password: password123")
    print(f"   ID: {result['user']['id']}")
else:
    print(f"   ℹ️  {result.get('error', 'Unknown error')}")

print("\n" + "=" * 60)
print("Test Users Created!")
print("=" * 60)
print("\nYou can now login with:")
print("\n📚 STUDENT ACCOUNTS:")
print("   - student@test.com / student123")
print("   - john.doe@student.com / password123")
print("\n👨‍🏫 TEACHER ACCOUNT:")
print("   - teacher@test.com / teacher123")
print("\n" + "=" * 60)

# Test login
print("\n4. Testing login with student account...")
result = auth_service.login(
    email="student@test.com",
    password="student123",
    role="student"
)
if result['success']:
    print("   ✅ Login successful!")
    print(f"   Token: {result['token'][:30]}...")
else:
    print(f"   ❌ Login failed: {result.get('error')}")

print("\n✅ Setup complete! Go to http://localhost:5173 and login!\n")
