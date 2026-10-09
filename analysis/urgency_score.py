"""Python implementation of the Citizen Grievance Urgency Scoring engine.

Aligns identically with src/utils/urgencyScore.js:
- Severity Weights: Low (10), Moderate (30), High (70), Critical (100)
- Population Impact Multipliers: Low (0.8), Medium (1.0), High (1.2)
- Concentration Score: min(concentration * 4, 40)
- Recurrence Score: min(recurrence * 5, 20)
- Raw Score: severity + concentration + recurrence
- Final Score: clamp(round(rawScore * popMultiplier), 0, 100)
- Urgency Levels:
    80 - 100: Critical
    60 - 79:  High
    40 - 59:  Moderate
    0 - 39:   Low
"""

from typing import Union

SEVERITY_WEIGHTS = {
    "Low": 10,
    "Moderate": 30,
    "High": 70,
    "Critical": 100,
}

POPULATION_WEIGHTS = {
    "Low": 0.8,
    "Medium": 1.0,
    "High": 1.2,
}


def calculate_urgency_score(
    severity: str = "Moderate",
    complaint_concentration: int = 0,
    population_impact: str = "Medium",
    recurrence: int = 0,
) -> int:
    """Calculate the urgency score (0-100) based on severity, concentration, impact, and recurrence.

    Args:
        severity: One of 'Low', 'Moderate', 'High', 'Critical'.
        complaint_concentration: Number of similar complaints in the vicinity.
        population_impact: One of 'Low', 'Medium', 'High'.
        recurrence: Recurrence count / history indicator.

    Returns:
        int: Clamped urgency score between 0 and 100.
    """
    severity_score = SEVERITY_WEIGHTS.get(severity, 30)
    concentration_score = min(max(0, complaint_concentration) * 4, 40)
    recurrence_score = min(max(0, recurrence) * 5, 20)

    raw_score = severity_score + concentration_score + recurrence_score
    pop_multiplier = POPULATION_WEIGHTS.get(population_impact, 1.0)

    final_score = int(round(raw_score * pop_multiplier))
    return max(0, min(100, final_score))


def get_urgency_level(score: Union[int, float]) -> str:
    """Map numeric urgency score to its qualitative level.

    Args:
        score: Numeric score between 0 and 100.

    Returns:
        str: 'Critical', 'High', 'Moderate', or 'Low'.
    """
    if score >= 80:
        return "Critical"
    elif score >= 60:
        return "High"
    elif score >= 40:
        return "Moderate"
    else:
        return "Low"
