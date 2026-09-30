"""Citizen Complaint Categorization and Priority Package.

This package provides deterministic, explainable, rule-based processing for citizen
complaints, assigning each complaint to a civic Category, Priority level, and
responsible Department.

Public API:
    process_complaint(description: str) -> dict
    categorize_complaint(description: str) -> str
    determine_priority(description: str, category: Optional[str] = None) -> str
    get_department(category: str) -> str
"""

from typing import Any, Dict, Optional

from categorization.categorizer import (
    CATEGORY_CRIME,
    CATEGORY_ELECTRICITY,
    CATEGORY_GARBAGE,
    CATEGORY_OTHER,
    CATEGORY_ROAD,
    CATEGORY_WATER,
    VALID_CATEGORIES,
    categorize_complaint,
    score_complaint,
)
from categorization.department import (
    CATEGORY_DEPARTMENT_MAPPING,
    DEFAULT_DEPARTMENT,
    get_department,
)
from categorization.priority import (
    PRIORITY_HIGH,
    PRIORITY_LOW,
    PRIORITY_MEDIUM,
    VALID_PRIORITIES,
    determine_priority,
    explain_priority,
)


def process_complaint(description: Optional[str]) -> Dict[str, str]:
    """Process a citizen complaint description and determine its category, priority, and department.

    Args:
        description: Text description of the complaint.

    Returns:
        A dictionary in the exact format:
        {
            "category": "...",
            "priority": "...",
            "department": "..."
        }
    """
    category = categorize_complaint(description)
    priority = determine_priority(description, category=category)
    department = get_department(category)

    return {
        "category": category,
        "priority": priority,
        "department": department,
    }


__all__ = [
    # Primary API
    "process_complaint",
    "categorize_complaint",
    "determine_priority",
    "get_department",
    "explain_priority",
    "score_complaint",
    # Constants
    "CATEGORY_ROAD",
    "CATEGORY_GARBAGE",
    "CATEGORY_WATER",
    "CATEGORY_ELECTRICITY",
    "CATEGORY_CRIME",
    "CATEGORY_OTHER",
    "VALID_CATEGORIES",
    "PRIORITY_HIGH",
    "PRIORITY_MEDIUM",
    "PRIORITY_LOW",
    "VALID_PRIORITIES",
    "CATEGORY_DEPARTMENT_MAPPING",
    "DEFAULT_DEPARTMENT",
]
