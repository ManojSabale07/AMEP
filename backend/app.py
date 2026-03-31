"""
AMEP Backend - Flask REST API v3.1
Adaptive Mastery and Learning Platform
Production-ready: .env config, file logging, session persistence, API versioning
"""

import os
import logging
import logging.handlers
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from services.prediction_service import PredictionService
from services.student_service import StudentService
from services.auth_service import AuthService
from utils.validators import validate_input
from functools import wraps

# ============== Load .env ==============
load_dotenv()

# ============== Logging Setup ==============
LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

log_level = getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper(), logging.INFO)
log_file = os.path.join(LOG_DIR, 'amep.log')

# Rotating file handler (5 MB max, keep 3 backups)
file_handler = logging.handlers.RotatingFileHandler(
    log_file, maxBytes=5 * 1024 * 1024, backupCount=3, encoding='utf-8'
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
))

console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

logging.basicConfig(level=log_level, handlers=[file_handler, console_handler])
logger = logging.getLogger(__name__)

# ============== Flask App ==============
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'amep_dev_secret')

# ============== CORS ==============
raw_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5175')
allowed_origins = [o.strip() for o in raw_origins.split(',')]
# Always allow common dev ports
allowed_origins += [
    "http://localhost:5173", "http://localhost:5174",
    "http://localhost:5175", "http://localhost:5176",
    "http://127.0.0.1:5173", "http://127.0.0.1:5175",
]
allowed_origins = list(set(allowed_origins))

CORS(app, resources={
    r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# ============== Services ==============
prediction_service = PredictionService()
student_service = StudentService()
auth_service = AuthService()


# ============== Auth Middleware ==============

def require_auth(allowed_roles=None):
    """Decorator to require authentication."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()

            if not token:
                return jsonify({'error': 'No token provided'}), 401

            validation = auth_service.validate_token(token)

            if not validation['valid']:
                return jsonify({'error': validation.get('error', 'Invalid token')}), 401

            if allowed_roles:
                user_role = validation['user']['role']
                if user_role not in allowed_roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403

            request.current_user = validation['user']
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ============== Health Check ==============

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'models_loaded': prediction_service.models_loaded,
        'version': '3.1.0',
        'environment': os.getenv('FLASK_ENV', 'development'),
        'endpoints': [
            'POST /auth/login', 'POST /auth/register', 'POST /auth/logout',
            'GET /auth/validate', 'GET /auth/me', 'POST /auth/refresh',
            'POST /predict', 'POST /predict-mastery', 'POST /predict-performance',
            'GET /students', 'GET /students/<id>', 'POST /add-student',
            'PUT /students/<id>', 'DELETE /students/<id>',
            'GET /student/profile', 'PUT /student/profile',
            'GET /class-analytics', 'GET /health'
        ]
    })


# ============== Authentication ==============

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        role = data.get('role', 'student')

        # Basic validation
        if not email or not password or not name:
            return jsonify({'error': 'Email, password, and name are required'}), 400
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({'error': 'Invalid email format'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        if role not in ['student', 'teacher']:
            return jsonify({'error': 'Role must be student or teacher'}), 400

        result = auth_service.register(email, password, name, role)

        if not result['success']:
            return jsonify({'error': result['error']}), 400

        logger.info(f"New {role} registered: {email}")
        return jsonify(result), 201

    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500


@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role = data.get('role', 'student')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        logger.info(f"Login attempt: {email} as {role}")
        result = auth_service.login(email, password, role)

        if not result['success']:
            logger.warning(f"Login failed for {email}: {result.get('error')}")
            return jsonify({'error': result['error']}), 401

        logger.info(f"Login successful: {email}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500


@app.route('/auth/logout', methods=['POST'])
@require_auth()
def logout():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
        result = auth_service.logout(token)
        logger.info(f"User logged out: {request.current_user.get('email')}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500


@app.route('/auth/validate', methods=['GET'])
def validate():
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
        if not token:
            return jsonify({'valid': False, 'error': 'No token provided'}), 401
        result = auth_service.validate_token(token)
        if not result['valid']:
            return jsonify(result), 401
        return jsonify(result)
    except Exception as e:
        logger.error(f"Validation error: {e}")
        return jsonify({'valid': False, 'error': 'Validation failed'}), 500


@app.route('/auth/me', methods=['GET'])
@require_auth()
def get_current_user():
    try:
        return jsonify({'success': True, 'user': request.current_user})
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return jsonify({'error': 'Failed to get user'}), 500


@app.route('/auth/refresh', methods=['POST'])
@require_auth()
def refresh_token():
    """Refresh session token — extends expiry by 24h."""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
        result = auth_service.refresh_session(token)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({'error': 'Refresh failed'}), 500


# ============== Prediction Endpoints ==============

@app.route('/predict', methods=['POST'])
@require_auth(['student', 'teacher'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        is_valid, error_msg = validate_input(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        result = prediction_service.predict(data)
        logger.info(f"Prediction for user {request.current_user.get('id')}: score={result.get('predicted_score')}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Predict error: {e}")
        return jsonify({'error': 'Prediction failed'}), 500


@app.route('/predict-mastery', methods=['POST'])
@require_auth(['student', 'teacher'])
def predict_mastery():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        is_valid, error_msg = validate_input(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        return jsonify(prediction_service.predict_mastery(data))
    except Exception as e:
        logger.error(f"Predict mastery error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/predict-performance', methods=['POST'])
@require_auth(['student', 'teacher'])
def predict_performance():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        is_valid, error_msg = validate_input(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        return jsonify(prediction_service.predict_performance(data))
    except Exception as e:
        logger.error(f"Predict performance error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== Student Management ==============

@app.route('/students', methods=['GET'])
@require_auth(['teacher'])
def get_students():
    try:
        students = student_service.get_all_students()
        students_with_predictions = []
        for student in students:
            student_data = {k: student[k] for k in ['studytime', 'failures', 'absences', 'G1', 'G2']}
            prediction = prediction_service.predict(student_data)
            students_with_predictions.append({**student, 'prediction': prediction})
        return jsonify({'students': students_with_predictions, 'count': len(students_with_predictions)})
    except Exception as e:
        logger.error(f"Get students error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/students/<student_id>', methods=['GET'])
@require_auth(['student', 'teacher'])
def get_student(student_id):
    try:
        student = student_service.get_student(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        student_data = {k: student[k] for k in ['studytime', 'failures', 'absences', 'G1', 'G2']}
        prediction = prediction_service.predict(student_data)
        return jsonify({**student, 'prediction': prediction})
    except Exception as e:
        logger.error(f"Get student error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/add-student', methods=['POST'])
@require_auth(['teacher'])
def add_student():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        if 'name' not in data or not data['name'].strip():
            return jsonify({'error': 'Student name is required'}), 400

        student = student_service.add_student(data)
        student_data = {k: student[k] for k in ['studytime', 'failures', 'absences', 'G1', 'G2']}
        prediction = prediction_service.predict(student_data)
        logger.info(f"Teacher {request.current_user.get('email')} added student: {student['name']}")
        return jsonify({'success': True, 'student': {**student, 'prediction': prediction}}), 201
    except Exception as e:
        logger.error(f"Add student error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/students/<student_id>', methods=['PUT'])
@require_auth(['teacher'])
def update_student(student_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        student = student_service.update_student(student_id, data)
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        student_data = {k: student[k] for k in ['studytime', 'failures', 'absences', 'G1', 'G2']}
        prediction = prediction_service.predict(student_data)
        return jsonify({'success': True, 'student': {**student, 'prediction': prediction}})
    except Exception as e:
        logger.error(f"Update student error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/students/<student_id>', methods=['DELETE'])
@require_auth(['teacher'])
def delete_student(student_id):
    try:
        success = student_service.delete_student(student_id)
        if not success:
            return jsonify({'error': 'Student not found'}), 404
        logger.info(f"Teacher deleted student: {student_id}")
        return jsonify({'success': True, 'message': 'Student deleted'})
    except Exception as e:
        logger.error(f"Delete student error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/student/profile', methods=['GET'])
@require_auth(['student'])
def get_student_profile():
    try:
        student_id = request.current_user['id']
        student = auth_service.get_user(student_id, 'student')
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        student_data = {
            'studytime': student.get('studytime', 2),
            'failures': student.get('failures', 0),
            'absences': student.get('absences', 0),
            'G1': student.get('G1', 0),
            'G2': student.get('G2', 0)
        }
        prediction = prediction_service.predict(student_data)
        return jsonify({'success': True, 'student': student, 'prediction': prediction})
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/student/profile', methods=['PUT'])
@require_auth(['student'])
def update_student_profile():
    try:
        student_id = request.current_user['id']
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        allowed_fields = ['studytime', 'failures', 'absences', 'G1', 'G2', 'name']
        updates = {k: v for k, v in data.items() if k in allowed_fields}
        student = auth_service.update_user(student_id, 'student', updates)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        student_data = {
            'studytime': student.get('studytime', 2),
            'failures': student.get('failures', 0),
            'absences': student.get('absences', 0),
            'G1': student.get('G1', 0),
            'G2': student.get('G2', 0)
        }
        prediction = prediction_service.predict(student_data)
        return jsonify({'success': True, 'student': student, 'prediction': prediction})
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== Analytics ==============

@app.route('/class-analytics', methods=['GET'])
@require_auth(['teacher'])
def get_class_analytics():
    try:
        students = student_service.get_all_students()
        predictions = []
        for student in students:
            student_data = {k: student[k] for k in ['studytime', 'failures', 'absences', 'G1', 'G2']}
            predictions.append(prediction_service.predict(student_data))

        stats = student_service.get_class_statistics(predictions)
        recommendations = []
        at_risk_students = []

        for i, student in enumerate(students):
            pred = predictions[i]
            risk_level = pred.get('risk_level', {}).get('level', 'none')
            if risk_level in ['high', 'medium']:
                at_risk_students.append({
                    'id': student['id'],
                    'name': student['name'],
                    'predicted_score': pred['predicted_score'],
                    'risk_level': risk_level,
                    'main_issue': pred.get('explanation', {}).get('main_reason', 'N/A')
                })

        if stats['at_risk_count'] > 0:
            recommendations.append({
                'type': 'attention',
                'priority': 'high',
                'message': f"{stats['at_risk_count']} students need immediate attention",
                'students': [s['name'] for s in at_risk_students if s['risk_level'] == 'high']
            })
        if stats['average_score'] < 10:
            recommendations.append({
                'type': 'class',
                'priority': 'high',
                'message': "Class average is below passing. Consider reviewing fundamental concepts."
            })
        if stats['mastery_rate'] < 50:
            recommendations.append({
                'type': 'mastery',
                'priority': 'medium',
                'message': f"Only {stats['mastery_rate']}% of students have mastered the material."
            })
        if stats.get('high_performers', 0) > 0:
            recommendations.append({
                'type': 'advancement',
                'priority': 'low',
                'message': f"{stats['high_performers']} students are ready for advanced material."
            })

        return jsonify({
            'statistics': stats,
            'at_risk_students': at_risk_students,
            'recommendations': recommendations,
            'score_distribution': {
                'excellent': sum(1 for p in predictions if p['predicted_score'] >= 16),
                'good': sum(1 for p in predictions if 12 <= p['predicted_score'] < 16),
                'average': sum(1 for p in predictions if 10 <= p['predicted_score'] < 12),
                'below_average': sum(1 for p in predictions if 8 <= p['predicted_score'] < 10),
                'failing': sum(1 for p in predictions if p['predicted_score'] < 8)
            }
        })
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== Error Handlers ==============

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found', 'available': '/health'}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed'}), 405


@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500


# ============== Entry Point ==============

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("Starting AMEP Backend Server v3.1")
    logger.info(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    logger.info(f"Models loaded: {prediction_service.models_loaded}")
    logger.info(f"Log file: {log_file}")
    logger.info("=" * 50)
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=8000, debug=debug)
