"""
Input validation utilities
"""

from typing import Tuple

# Valid ranges for input fields
VALIDATION_RULES = {
    'studytime': {'min': 1, 'max': 4, 'type': (int, float)},
    'failures': {'min': 0, 'max': 4, 'type': (int, float)},
    'absences': {'min': 0, 'max': 93, 'type': (int, float)},
    'G1': {'min': 0, 'max': 20, 'type': (int, float)},
    'G2': {'min': 0, 'max': 20, 'type': (int, float)},
}

REQUIRED_FIELDS = ['studytime', 'failures', 'absences', 'G1', 'G2']


def validate_input(data: dict) -> Tuple[bool, str]:
    """
    Validate input data for prediction.

    Args:
        data: Dictionary containing input fields

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Input must be a JSON object"

    # Check for required fields
    missing_fields = [field for field in REQUIRED_FIELDS if field not in data]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"

    # Validate each field
    for field, rules in VALIDATION_RULES.items():
        value = data.get(field)

        # Check type
        if not isinstance(value, rules['type']):
            return False, f"Field '{field}' must be a number"

        # Check range
        if value < rules['min'] or value > rules['max']:
            return False, f"Field '{field}' must be between {rules['min']} and {rules['max']}"

    return True, ""
