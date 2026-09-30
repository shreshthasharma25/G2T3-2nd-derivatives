"""Department mapping for citizen grievances.

Maps complaint categories to their designated government / municipal departments.
"""

from typing import Dict

# Exact category-to-department mappings specified by system requirements:
CATEGORY_DEPARTMENT_MAPPING: Dict[str, str] = {
    "Road / Infrastructure": "Public Works Department",
    "Garbage / Waste": "Municipality",
    "Water": "Water Department",
    "Electricity / Streetlight": "Electricity Department",
    "Crime / Safety": "Police",
    "Other": "General Department",
}

DEFAULT_DEPARTMENT: str = "General Department"


def get_department(category: str) -> str:
    """Return the designated department for a given complaint category.

    Args:
        category: The complaint category string.

    Returns:
        The designated department name. Defaults to 'General Department'
        if the category is unknown, invalid, or empty.
    """
    if not isinstance(category, str):
        return DEFAULT_DEPARTMENT

    cleaned_category = category.strip()
    return CATEGORY_DEPARTMENT_MAPPING.get(cleaned_category, DEFAULT_DEPARTMENT)
