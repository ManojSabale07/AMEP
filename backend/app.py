"""
AMEP Backend - Flask REST API v3.0
Adaptive Mastery and Learning Platform
With Student/Teacher Dashboard Support
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

from services.prediction_service import PredictionService
from services.student_service import StudentService
from services.auth_service import AuthService
from utils.validators import validate_input
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Initialize services
prediction_service = PredictionService()
student_service = StudentService()
auth_service = AuthService()


# ============== Auth Middleware ==============

def require_auth(allowed_roles=None):
    """Decorator to require authentication."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            validation = auth_service.validate_token(token)
            
            if not validation['valid']:
                return jsonify({'error': validation.get('error', 'Invalid token')}), 401
            
            # Check role if specified
            if allowed_roles:
                user_role = validation['user']['role']
                if user_role not in allowed_roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
            
            # Attach user to request
            request.current_user = validation['user']
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ============== Health Check ==============

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'models_loaded': prediction_service.models_loaded,
        'version': '3.0.0',
        'endpoints': [
            'POST /predict',
            'POST /predict-mastery',
            'POST /predict-performance',
            'GET /students',
            'GET /students/<id>',
            'POST /add-student',
            'PUT /students/<id>',
            'DELETE /students/<id>',
            'GET /class-analytics'
        ]
    })


# ============== Authentication ==============

@app.route('/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        role = data.get('role', 'student')
        
        result = auth_service.register(email, password, name, role)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        return jsonify(result), 201
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500


@app.route('/auth/login', methods=['POST'])
def login():
    """Authenticate user and create session."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        role = data.get('role', 'student')
        
        logger.info(f"Login attempt: email={email}, role={role}")
        
        result = auth_service.login(email, password, role)
        
        if not result['success']:
            logger.warning(f"Login failed for {email}: {result.get('error')}")
            return jsonify({'error': result['error']}), 401
        
        logger.info(f"Login successful for {email}")
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500


@app.route('/auth/logout', methods=['POST'])
@require_auth()
def logout():
    """Logout user and invalidate token."""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        result = auth_service.logout(token)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500


@app.route('/auth/validate', methods=['GET'])
def validate():
    """Validate current session token."""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'valid': False, 'error': 'No token provided'}), 401
        
        result = auth_service.validate_token(token)
        
        if not result['valid']:
            return jsonify(result), 401
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({'valid': False, 'error': 'Validation failed'}), 500


@app.route('/auth/me', methods=['GET'])
@require_auth()
def get_current_user():
    """Get current user information."""
    try:
        return jsonify({
            'success': True,
            'user': request.current_user
        })
    
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return jsonify({'error': 'Failed to get user'}), 500


# ============== Prediction Endpoints ==============

@app.route('/predict', methods=['POST'])
@require_auth(['student', 'teacher'])
def predict():
    """Full prediction with all analytics."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        is_valid, error_msg = validate_input(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        result = prediction_service.predict(data)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in predict: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/predict-mastery', methods=['POST'])
@require_auth(['student', 'teacher'])
def predict_mastery():
    """Predict mastery status only."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        is_valid, error_msg = validate_input(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        result = prediction_service.predict_mastery(data)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in predict_mastery: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/predict-performance', methods=['POST'])
@require_auth(['student', 'teacher'])
def predict_performance():
    """Predict performance score and mastery."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        is_valid, error_msg = validate_input(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        result = prediction_service.predict_performance(data)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in predict_performance: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== Student Management ==============

@app.route('/students', methods=['GET'])
@require_auth(['teacher'])
def get_students():
    """Get all students with their predictions."""
    try:
        students = student_service.get_all_students()

        # Calculate predictions for each student
        students_with_predictions = []
        for student in students:
            student_data = {
                'studytime': student['studytime'],
                'failures': student['failures'],
                'absences': student['absences'],
                'G1': student['G1'],
                'G2': student['G2']
            }

            prediction = prediction_service.predict(student_data)

            students_with_predictions.append({
                **student,
                'prediction': prediction
            })

        return jsonify({
            'students': students_with_predictions,
            'count': len(students_with_predictions)
        })

    except Exception as e:
        logger.error(f"Error getting students: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/students/<student_id>', methods=['GET'])
@require_auth(['student', 'teacher'])
def get_student(student_id):
    """Get a single student with prediction."""
    try:
        student = student_service.get_student(student_id)

        if not student:
            return jsonify({'error': 'Student not found'}), 404

        student_data = {
            'studytime': student['studytime'],
            'failures': student['failures'],
            'absences': student['absences'],
            'G1': student['G1'],
            'G2': student['G2']
        }

        prediction = prediction_service.predict(student_data)

        return jsonify({
            **student,
            'prediction': prediction
        })

    except Exception as e:
        logger.error(f"Error getting student: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/add-student', methods=['POST'])
@require_auth(['teacher'])
def add_student():
    """Add a new student."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Validate required fields
        if 'name' not in data:
            return jsonify({'error': 'Name is required'}), 400

        student = student_service.add_student(data)

        # Get prediction for new student
        student_data = {
            'studytime': student['studytime'],
            'failures': student['failures'],
            'absences': student['absences'],
            'G1': student['G1'],
            'G2': student['G2']
        }
        prediction = prediction_service.predict(student_data)

        return jsonify({
            'success': True,
            'student': {**student, 'prediction': prediction}
        }), 201

    except Exception as e:
        logger.error(f"Error adding student: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/students/<student_id>', methods=['PUT'])
@require_auth(['teacher'])
def update_student(student_id):
    """Update a student."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        student = student_service.update_student(student_id, data)

        if not student:
            return jsonify({'error': 'Student not found'}), 404

        # Get updated prediction
        student_data = {
            'studytime': student['studytime'],
            'failures': student['failures'],
            'absences': student['absences'],
            'G1': student['G1'],
            'G2': student['G2']
        }
        prediction = prediction_service.predict(student_data)

        return jsonify({
            'success': True,
            'student': {**student, 'prediction': prediction}
        })

    except Exception as e:
        logger.error(f"Error updating student: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/students/<student_id>', methods=['DELETE'])
@require_auth(['teacher'])
def delete_student(student_id):
    """Delete a student."""
    try:
        success = student_service.delete_student(student_id)

        if not success:
            return jsonify({'error': 'Student not found'}), 404

        return jsonify({'success': True, 'message': 'Student deleted'})

    except Exception as e:
        logger.error(f"Error deleting student: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/student/profile', methods=['GET'])
@require_auth(['student'])
def get_student_profile():
    """Get current student's profile and prediction."""
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
        
        return jsonify({
            'success': True,
            'student': student,
            'prediction': prediction
        })
    
    except Exception as e:
        logger.error(f"Error getting student profile: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/student/profile', methods=['PUT'])
@require_auth(['student'])
def update_student_profile():
    """Update current student's profile."""
    try:
        student_id = request.current_user['id']
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Allow updating specific student fields
        allowed_fields = ['studytime', 'failures', 'absences', 'G1', 'G2', 'name']
        updates = {k: v for k, v in data.items() if k in allowed_fields}
        
        student = auth_service.update_user(student_id, 'student', updates)
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        # Get updated prediction
        student_data = {
            'studytime': student.get('studytime', 2),
            'failures': student.get('failures', 0),
            'absences': student.get('absences', 0),
            'G1': student.get('G1', 0),
            'G2': student.get('G2', 0)
        }
        prediction = prediction_service.predict(student_data)
        
        return jsonify({
            'success': True,
            'student': student,
            'prediction': prediction
        })
    
    except Exception as e:
        logger.error(f"Error updating student profile: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== Analytics ==============

@app.route('/class-analytics', methods=['GET'])
@require_auth(['teacher'])
def get_class_analytics():
    """Get class-level analytics and insights."""
    try:
        students = student_service.get_all_students()

        # Calculate predictions for all students
        predictions = []
        for student in students:
            student_data = {
                'studytime': student['studytime'],
                'failures': student['failures'],
                'absences': student['absences'],
                'G1': student['G1'],
                'G2': student['G2']
            }
            prediction = prediction_service.predict(student_data)
            predictions.append(prediction)

        # Calculate statistics
        stats = student_service.get_class_statistics(predictions)

        # Generate teacher recommendations
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

        # Generate teacher insights
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
                'message': f"Only {stats['mastery_rate']}% of students have mastered the material. More practice may be needed."
            })

        if stats['high_performers'] > 0:
            recommendations.append({
                'type': 'advancement',
                'priority': 'low',
                'message': f"{stats['high_performers']} students are ready for advanced material or peer tutoring roles."
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
        logger.error(f"Error getting analytics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# ============== Error Handlers ==============

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("Starting AMEP Backend Server v3.0")
    logger.info("=" * 50)
    logger.info("Endpoints:")
    logger.info("  Auth:       POST /auth/login")
    logger.info("  Predict:    POST /predict")
    logger.info("  Students:   GET/POST /students")
    logger.info("  Analytics:  GET /class-analytics")
    logger.info("  Health:     GET /health")
    logger.info("=" * 50)
    app.run(host='0.0.0.0', port=8000, debug=True)
