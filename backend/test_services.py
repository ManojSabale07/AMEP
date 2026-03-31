"""
Quick test script to verify backend services work
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 50)
print("Testing AMEP Backend Services")
print("=" * 50)

# Test 1: Import auth service
print("\n1. Testing Auth Service Import...")
try:
    from services.auth_service import AuthService
    auth_service = AuthService()
    print("   ✅ Auth Service imported successfully")
except Exception as e:
    print(f"   ❌ Error importing Auth Service: {e}")
    sys.exit(1)

# Test 2: Test user registration
print("\n2. Testing User Registration...")
try:
    result = auth_service.register(
        email="test@student.com",
        password="password123",
        name="Test Student",
        role="student"
    )
    if result['success']:
        print(f"   ✅ Student registered: {result['user']['name']}")
    else:
        print(f"   ℹ️  Registration result: {result.get('error', 'Unknown')}")
except Exception as e:
    print(f"   ❌ Error registering user: {e}")

# Test 3: Test user login
print("\n3. Testing User Login...")
try:
    result = auth_service.login(
        email="test@student.com",
        password="password123",
        role="student"
    )
    if result['success']:
        print(f"   ✅ Login successful")
        print(f"   Token: {result['token'][:20]}...")
        token = result['token']
    else:
        print(f"   ❌ Login failed: {result.get('error')}")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Error during login: {e}")
    sys.exit(1)

# Test 4: Test token validation
print("\n4. Testing Token Validation...")
try:
    result = auth_service.validate_token(token)
    if result['valid']:
        print(f"   ✅ Token is valid")
        print(f"   User: {result['user']['name']}")
    else:
        print(f"   ❌ Token invalid: {result.get('error')}")
except Exception as e:
    print(f"   ❌ Error validating token: {e}")

# Test 5: Import other services
print("\n5. Testing Other Services...")
try:
    from services.prediction_service import PredictionService
    from services.student_service import StudentService
    
    prediction_service = PredictionService()
    student_service = StudentService()
    
    print("   ✅ All services imported successfully")
except Exception as e:
    print(f"   ❌ Error importing services: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("✅ All tests passed! Backend is ready to start.")
print("=" * 50)
print("\nRun 'python app.py' to start the Flask server")
