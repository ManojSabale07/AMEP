"""
Prediction Service - Handles model loading and predictions
Enhanced with Explainable AI, Learning Paths, Risk Detection, and Profile Analysis
"""

import os
import logging
import numpy as np
import joblib

logger = logging.getLogger(__name__)

# Path to models directory
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')

# Feature names for explanation
FEATURE_NAMES = ['studytime', 'failures', 'absences', 'G1', 'G2']

# Feature weights for explanation (approximate importance)
FEATURE_WEIGHTS = {
    'studytime': 0.10,
    'failures': 0.15,
    'absences': 0.10,
    'G1': 0.25,
    'G2': 0.40
}


class PredictionService:
    """Service class for handling ML predictions with advanced analytics."""

    def __init__(self):
        """Initialize and load models."""
        self.kt_model = None  # Knowledge Tracing (classification)
        self.pp_model = None  # Performance Prediction (regression)
        self.models_loaded = False
        self._load_models()

    def _load_models(self):
        """Load pre-trained models from disk."""
        kt_path = os.path.join(MODELS_DIR, 'knowledge_tracing_model.pkl')
        pp_path = os.path.join(MODELS_DIR, 'performance_prediction_model.pkl')

        try:
            if os.path.exists(kt_path) and os.path.getsize(kt_path) > 0:
                self.kt_model = joblib.load(kt_path)
                logger.info("Knowledge Tracing model loaded successfully")
            else:
                logger.warning("Knowledge Tracing model not found - using fallback")

            if os.path.exists(pp_path) and os.path.getsize(pp_path) > 0:
                self.pp_model = joblib.load(pp_path)
                logger.info("Performance Prediction model loaded successfully")
            else:
                logger.warning("Performance Prediction model not found - using fallback")

            self.models_loaded = self.kt_model is not None and self.pp_model is not None

        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            self.models_loaded = False

    def _prepare_features(self, data: dict) -> np.ndarray:
        """Convert input data to model-compatible feature array."""
        features = np.array([[
            data['studytime'],
            data['failures'],
            data['absences'],
            data['G1'],
            data['G2']
        ]])
        return features

    def _fallback_mastery(self, data: dict) -> int:
        """Fallback mastery prediction when model is not available."""
        avg_grade = (data['G1'] + data['G2']) / 2
        if avg_grade >= 10 and data['failures'] <= 1 and data['studytime'] >= 2:
            return 1
        return 0

    def _fallback_score(self, data: dict) -> float:
        """Fallback score prediction when model is not available."""
        base_score = 0.1 * data['G1'] + 0.9 * data['G2']
        adjustment = 0
        adjustment += (data['studytime'] - 2) * 0.5
        adjustment -= data['failures'] * 1.0
        adjustment -= data['absences'] * 0.05
        predicted = base_score + adjustment
        return max(0, min(20, predicted))

    def _get_risk_level(self, predicted_score: float) -> dict:
        """Determine risk level based on predicted score."""
        if predicted_score < 8:
            return {
                'level': 'high',
                'label': 'High Risk',
                'message': 'High risk of failure. Immediate intervention recommended.',
                'color': '#ef4444'
            }
        elif predicted_score < 10:
            return {
                'level': 'medium',
                'label': 'Medium Risk',
                'message': 'At risk of underperforming. Additional support suggested.',
                'color': '#f59e0b'
            }
        elif predicted_score < 14:
            return {
                'level': 'low',
                'label': 'Low Risk',
                'message': 'On track but room for improvement.',
                'color': '#3b82f6'
            }
        else:
            return {
                'level': 'none',
                'label': 'No Risk',
                'message': 'Excellent performance trajectory.',
                'color': '#10b981'
            }

    def _generate_explanation(self, data: dict, predicted_score: float) -> dict:
        """Generate explainable AI insights."""
        contributions = []

        # Analyze each feature's impact
        # G2 impact (most important)
        g2_impact = 'positive' if data['G2'] >= 10 else 'negative'
        g2_strength = abs(data['G2'] - 10) / 10
        contributions.append({
            'feature': 'G2 (Second Period Grade)',
            'value': data['G2'],
            'impact': g2_impact,
            'weight': FEATURE_WEIGHTS['G2'],
            'importance': g2_strength * FEATURE_WEIGHTS['G2']
        })

        # G1 impact
        g1_impact = 'positive' if data['G1'] >= 10 else 'negative'
        g1_strength = abs(data['G1'] - 10) / 10
        contributions.append({
            'feature': 'G1 (First Period Grade)',
            'value': data['G1'],
            'impact': g1_impact,
            'weight': FEATURE_WEIGHTS['G1'],
            'importance': g1_strength * FEATURE_WEIGHTS['G1']
        })

        # Failures impact
        failures_impact = 'negative' if data['failures'] > 0 else 'positive'
        failures_strength = data['failures'] / 4
        contributions.append({
            'feature': 'Past Failures',
            'value': data['failures'],
            'impact': failures_impact,
            'weight': FEATURE_WEIGHTS['failures'],
            'importance': failures_strength * FEATURE_WEIGHTS['failures']
        })

        # Study time impact
        studytime_impact = 'positive' if data['studytime'] >= 2 else 'negative'
        studytime_strength = abs(data['studytime'] - 2.5) / 2
        contributions.append({
            'feature': 'Study Time',
            'value': data['studytime'],
            'impact': studytime_impact,
            'weight': FEATURE_WEIGHTS['studytime'],
            'importance': studytime_strength * FEATURE_WEIGHTS['studytime']
        })

        # Absences impact
        absences_impact = 'negative' if data['absences'] > 10 else 'positive'
        absences_strength = min(data['absences'] / 30, 1)
        contributions.append({
            'feature': 'Absences',
            'value': data['absences'],
            'impact': absences_impact,
            'weight': FEATURE_WEIGHTS['absences'],
            'importance': absences_strength * FEATURE_WEIGHTS['absences']
        })

        # Sort by importance
        contributions.sort(key=lambda x: x['importance'], reverse=True)

        # Generate main explanation
        top_factor = contributions[0]
        if top_factor['impact'] == 'negative':
            main_reason = f"Low {top_factor['feature'].split('(')[0].strip()} is the main factor affecting your prediction."
        else:
            main_reason = f"Strong {top_factor['feature'].split('(')[0].strip()} is positively influencing your prediction."

        # Generate detailed insights
        insights = []
        for c in contributions[:3]:
            if c['impact'] == 'negative':
                insights.append(f"{c['feature']}: {c['value']} (needs improvement)")
            else:
                insights.append(f"{c['feature']}: {c['value']} (good)")

        return {
            'main_reason': main_reason,
            'contributions': contributions,
            'insights': insights,
            'confidence': 0.85 if self.models_loaded else 0.70
        }

    def _generate_learning_path(self, data: dict, mastery: int, predicted_score: float) -> dict:
        """Generate personalized learning path."""
        # Determine difficulty level
        if mastery == 0 or predicted_score < 8:
            difficulty = 'easy'
            difficulty_label = 'Beginner'
        elif mastery == 1 and predicted_score > 12:
            difficulty = 'hard'
            difficulty_label = 'Advanced'
        else:
            difficulty = 'medium'
            difficulty_label = 'Intermediate'

        # Generate next steps based on weaknesses
        next_steps = []
        study_plan = []

        if data['G2'] < 10:
            next_steps.append('Review recent course material thoroughly')
            study_plan.append({'topic': 'Recent Topics Review', 'duration': '2-3 hours/day', 'priority': 'high'})

        if data['G1'] < 10:
            next_steps.append('Strengthen foundational concepts')
            study_plan.append({'topic': 'Foundation Revision', 'duration': '1-2 hours/day', 'priority': 'high'})

        if data['failures'] > 0:
            next_steps.append('Identify and address recurring problem areas')
            study_plan.append({'topic': 'Weak Areas Practice', 'duration': '1 hour/day', 'priority': 'medium'})

        if data['studytime'] < 2:
            next_steps.append('Increase dedicated study time')
            study_plan.append({'topic': 'Study Schedule', 'duration': 'Add 1-2 hours/day', 'priority': 'high'})

        if data['absences'] > 10:
            next_steps.append('Improve class attendance')
            study_plan.append({'topic': 'Attendance Goals', 'duration': 'Attend all classes', 'priority': 'high'})

        # Add positive reinforcement if doing well
        if mastery == 1 and predicted_score >= 12:
            next_steps.append('Challenge yourself with advanced problems')
            next_steps.append('Consider peer tutoring to reinforce knowledge')
            study_plan.append({'topic': 'Advanced Practice', 'duration': '1-2 hours/day', 'priority': 'medium'})

        # Default steps if none generated
        if not next_steps:
            next_steps = [
                'Maintain current study habits',
                'Practice with past exam questions',
                'Join study groups for collaborative learning'
            ]
            study_plan = [
                {'topic': 'Regular Practice', 'duration': '1-2 hours/day', 'priority': 'medium'},
                {'topic': 'Exam Preparation', 'duration': '2 hours/week', 'priority': 'medium'}
            ]

        # Calculate progress percentage (how close to mastery/good score)
        progress = min(100, int((predicted_score / 14) * 100))

        return {
            'difficulty': difficulty,
            'difficulty_label': difficulty_label,
            'next_steps': next_steps[:5],  # Limit to 5 steps
            'study_plan': study_plan[:4],  # Limit to 4 items
            'progress': progress,
            'estimated_improvement': f"+{max(1, int(14 - predicted_score))} points possible with focused effort"
        }

    def _generate_recommendation(self, mastery: int, predicted_score: float, data: dict) -> dict:
        """Generate comprehensive recommendation."""
        if mastery == 0:
            plan_type = 'beginner'
            title = 'Beginner Learning Plan'
            description = 'Focus on building strong foundations before advancing.'
            actions = [
                'Review basic concepts from the beginning',
                'Schedule regular study sessions',
                'Seek help from teachers or tutors',
                'Practice with simple exercises first'
            ]
        elif mastery == 1 and predicted_score > 12:
            plan_type = 'advanced'
            title = 'Advanced Learning Plan'
            description = 'You\'re excelling! Time to push your limits.'
            actions = [
                'Tackle challenging problems',
                'Explore topics beyond the curriculum',
                'Help peers to reinforce your knowledge',
                'Prepare for competitive exams or olympiads'
            ]
        else:
            plan_type = 'intermediate'
            title = 'Intermediate Learning Plan'
            description = 'Good progress! Focus on consistency and filling gaps.'
            actions = [
                'Identify specific weak areas',
                'Practice medium-difficulty problems',
                'Maintain regular study schedule',
                'Review mistakes from past tests'
            ]

        return {
            'plan_type': plan_type,
            'title': title,
            'description': description,
            'actions': actions
        }

    def _generate_profile(self, data: dict, mastery: int, predicted_score: float) -> dict:
        """Generate student profile summary."""
        strengths = []
        weaknesses = []

        # Analyze strengths
        if data['G1'] >= 12:
            strengths.append('Strong foundation (high G1)')
        if data['G2'] >= 12:
            strengths.append('Recent performance is excellent (high G2)')
        if data['studytime'] >= 3:
            strengths.append('Dedicated study habits')
        if data['failures'] == 0:
            strengths.append('No history of failures')
        if data['absences'] <= 5:
            strengths.append('Excellent attendance')

        # Analyze weaknesses
        if data['G1'] < 10:
            weaknesses.append('Weak foundation (low G1)')
        if data['G2'] < 10:
            weaknesses.append('Recent performance needs work (low G2)')
        if data['studytime'] <= 1:
            weaknesses.append('Insufficient study time')
        if data['failures'] >= 2:
            weaknesses.append('Multiple past failures')
        if data['absences'] > 15:
            weaknesses.append('High absenteeism')

        # Determine overall performance tag
        if predicted_score >= 14 and mastery == 1:
            performance_tag = 'strong'
            performance_label = 'Strong Performer'
            performance_color = '#10b981'
        elif predicted_score >= 10:
            performance_tag = 'average'
            performance_label = 'Average Performer'
            performance_color = '#3b82f6'
        else:
            performance_tag = 'weak'
            performance_label = 'Needs Improvement'
            performance_color = '#f59e0b'

        # Default messages if lists are empty
        if not strengths:
            strengths = ['Room for improvement in all areas']
        if not weaknesses:
            weaknesses = ['No major weaknesses identified']

        return {
            'strengths': strengths,
            'weaknesses': weaknesses,
            'performance_tag': performance_tag,
            'performance_label': performance_label,
            'performance_color': performance_color,
            'summary': f"Based on your data, you are classified as a {performance_label.lower()}. " +
                      (f"Your main strengths are in {strengths[0].lower()}. " if strengths[0] != 'Room for improvement in all areas' else '') +
                      (f"Focus on improving {weaknesses[0].lower()}." if weaknesses[0] != 'No major weaknesses identified' else 'Keep up the great work!')
        }

    def predict(self, data: dict) -> dict:
        """
        Full prediction with all advanced features.

        Args:
            data: Dictionary with studytime, failures, absences, G1, G2

        Returns:
            Complete prediction response with all analytics
        """
        features = self._prepare_features(data)

        # Predict mastery
        if self.kt_model is not None:
            mastery = int(self.kt_model.predict(features)[0])
        else:
            mastery = self._fallback_mastery(data)

        # Predict score
        if self.pp_model is not None:
            predicted_score = float(self.pp_model.predict(features)[0])
        else:
            predicted_score = self._fallback_score(data)

        # Ensure score is within valid range
        predicted_score = max(0, min(20, predicted_score))

        # Generate all analytics
        risk = self._get_risk_level(predicted_score)
        explanation = self._generate_explanation(data, predicted_score)
        learning_path = self._generate_learning_path(data, mastery, predicted_score)
        recommendation = self._generate_recommendation(mastery, predicted_score, data)
        profile = self._generate_profile(data, mastery, predicted_score)

        return {
            'mastery': mastery,
            'mastery_status': 'Mastered' if mastery == 1 else 'Not Mastered',
            'predicted_score': round(predicted_score, 2),
            'risk_level': risk,
            'recommendation': recommendation,
            'explanation': explanation,
            'learning_path': learning_path,
            'profile': profile,
            'input_data': data
        }

    # Keep backward compatibility
    def predict_mastery(self, data: dict) -> dict:
        """Predict mastery status only."""
        result = self.predict(data)
        return {
            'mastery': result['mastery'],
            'mastery_status': result['mastery_status'],
            'recommendation': result['recommendation']['description']
        }

    def predict_performance(self, data: dict) -> dict:
        """Predict performance (backward compatible)."""
        result = self.predict(data)
        return {
            'mastery': result['mastery'],
            'mastery_status': result['mastery_status'],
            'predicted_score': result['predicted_score'],
            'recommendation': result['recommendation']['description']
        }
