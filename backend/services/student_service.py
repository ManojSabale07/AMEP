"""
Student Service - Handles student data management
"""

import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional

# Data file path
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
STUDENTS_FILE = os.path.join(DATA_DIR, 'students.json')


class StudentService:
    """Service class for managing student data."""

    def __init__(self):
        """Initialize and load student data."""
        self._ensure_data_dir()
        self.students = self._load_students()

    def _ensure_data_dir(self):
        """Ensure data directory exists."""
        os.makedirs(DATA_DIR, exist_ok=True)

    def _load_students(self) -> Dict[str, dict]:
        """Load students from JSON file."""
        if os.path.exists(STUDENTS_FILE):
            try:
                with open(STUDENTS_FILE, 'r') as f:
                    data = json.load(f)
                    return {s['id']: s for s in data}
            except (json.JSONDecodeError, KeyError):
                return {}
        return self._create_sample_students()

    def _save_students(self):
        """Save students to JSON file."""
        with open(STUDENTS_FILE, 'w') as f:
            json.dump(list(self.students.values()), f, indent=2)

    def _create_sample_students(self) -> Dict[str, dict]:
        """Create sample student data for demo."""
        sample_students = [
            {"name": "Alice Johnson", "studytime": 3, "failures": 0, "absences": 2, "G1": 14, "G2": 15},
            {"name": "Bob Smith", "studytime": 2, "failures": 1, "absences": 8, "G1": 10, "G2": 9},
            {"name": "Charlie Brown", "studytime": 1, "failures": 2, "absences": 15, "G1": 7, "G2": 6},
            {"name": "Diana Lee", "studytime": 4, "failures": 0, "absences": 1, "G1": 16, "G2": 17},
            {"name": "Edward Davis", "studytime": 2, "failures": 0, "absences": 5, "G1": 12, "G2": 13},
            {"name": "Fiona Garcia", "studytime": 1, "failures": 3, "absences": 20, "G1": 5, "G2": 4},
            {"name": "George Wilson", "studytime": 3, "failures": 0, "absences": 3, "G1": 13, "G2": 14},
            {"name": "Hannah Martinez", "studytime": 2, "failures": 1, "absences": 10, "G1": 9, "G2": 8},
            {"name": "Ivan Taylor", "studytime": 4, "failures": 0, "absences": 0, "G1": 18, "G2": 19},
            {"name": "Julia Anderson", "studytime": 2, "failures": 0, "absences": 6, "G1": 11, "G2": 12},
        ]

        students = {}
        for i, student_data in enumerate(sample_students):
            student_id = f"STU{str(i+1).zfill(4)}"
            students[student_id] = {
                "id": student_id,
                "name": student_data["name"],
                "email": f"{student_data['name'].lower().replace(' ', '.')}@school.edu",
                "studytime": student_data["studytime"],
                "failures": student_data["failures"],
                "absences": student_data["absences"],
                "G1": student_data["G1"],
                "G2": student_data["G2"],
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

        # Save sample data
        self.students = students
        self._save_students()
        return students

    def get_all_students(self) -> List[dict]:
        """Get all students."""
        return list(self.students.values())

    def get_student(self, student_id: str) -> Optional[dict]:
        """Get a single student by ID."""
        return self.students.get(student_id)

    def add_student(self, data: dict) -> dict:
        """Add a new student."""
        # Generate ID
        existing_ids = [int(sid.replace('STU', '')) for sid in self.students.keys() if sid.startswith('STU')]
        next_id = max(existing_ids, default=0) + 1
        student_id = f"STU{str(next_id).zfill(4)}"

        student = {
            "id": student_id,
            "name": data.get("name", f"Student {next_id}"),
            "email": data.get("email", f"student{next_id}@school.edu"),
            "studytime": data.get("studytime", 2),
            "failures": data.get("failures", 0),
            "absences": data.get("absences", 0),
            "G1": data.get("G1", 10),
            "G2": data.get("G2", 10),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        self.students[student_id] = student
        self._save_students()
        return student

    def update_student(self, student_id: str, data: dict) -> Optional[dict]:
        """Update an existing student."""
        if student_id not in self.students:
            return None

        student = self.students[student_id]

        # Update allowed fields
        allowed_fields = ['name', 'email', 'studytime', 'failures', 'absences', 'G1', 'G2']
        for field in allowed_fields:
            if field in data:
                student[field] = data[field]

        student['updated_at'] = datetime.now().isoformat()

        self._save_students()
        return student

    def delete_student(self, student_id: str) -> bool:
        """Delete a student."""
        if student_id in self.students:
            del self.students[student_id]
            self._save_students()
            return True
        return False

    def get_class_statistics(self, predictions: List[dict]) -> dict:
        """Calculate class-level statistics."""
        if not predictions:
            return {
                "total_students": 0,
                "average_score": 0,
                "mastery_rate": 0,
                "risk_distribution": {"high": 0, "medium": 0, "low": 0, "none": 0},
                "at_risk_count": 0
            }

        total = len(predictions)
        scores = [p.get('predicted_score', 0) for p in predictions]
        mastered = sum(1 for p in predictions if p.get('mastery', 0) == 1)

        risk_dist = {"high": 0, "medium": 0, "low": 0, "none": 0}
        for p in predictions:
            risk_level = p.get('risk_level', {}).get('level', 'none')
            risk_dist[risk_level] = risk_dist.get(risk_level, 0) + 1

        return {
            "total_students": total,
            "average_score": round(sum(scores) / total, 2) if total > 0 else 0,
            "mastery_rate": round((mastered / total) * 100, 1) if total > 0 else 0,
            "risk_distribution": risk_dist,
            "at_risk_count": risk_dist.get('high', 0) + risk_dist.get('medium', 0),
            "high_performers": sum(1 for s in scores if s >= 14),
            "needs_support": sum(1 for s in scores if s < 10)
        }
