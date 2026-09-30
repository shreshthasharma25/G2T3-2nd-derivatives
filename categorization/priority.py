"""Priority assessment module for citizen complaints.

Determines whether a grievance is High, Medium, or Low priority using
deterministic, explainable rule-based patterns.
"""

import re
from typing import List, Optional, Tuple

PRIORITY_HIGH = "High"
PRIORITY_MEDIUM = "Medium"
PRIORITY_LOW = "Low"

VALID_PRIORITIES = (PRIORITY_HIGH, PRIORITY_MEDIUM, PRIORITY_LOW)

# --- High Priority Patterns ---
# Immediate threat to human life, public safety, acute physical injury, or catastrophic hazard.
# Specifically includes: accident, danger, fire, emergency, unsafe, flood, injury.
HIGH_PRIORITY_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("accident", re.compile(r"\b(?:accidents?|accidental)\b", re.IGNORECASE)),
    ("danger", re.compile(r"\b(?:danger(?:ous)?|dangers|hazard(?:ous)?|hazards|peril(?:ous)?)\b", re.IGNORECASE)),
    ("fire", re.compile(r"\b(?:fires?|blaze|flames?|explosions?|explode|blast|burning)\b", re.IGNORECASE)),
    ("emergency", re.compile(r"\b(?:emergenc(?:y|ies)|urgents?|urgently|critical|life-threatening|fatalt?|fatalities|fatality|casualties|casualty)\b", re.IGNORECASE)),
    ("unsafe", re.compile(r"\b(?:unsafe|risk of death|harmful)\b", re.IGNORECASE)),
    ("flood", re.compile(r"\b(?:floods?|flooding|submerged|drowning)\b", re.IGNORECASE)),
    ("injury", re.compile(r"\b(?:injur(?:y|ies|ed)|hurts?|bleeding|hospital(?:ized)?|ambulance)\b", re.IGNORECASE)),
    ("acute_hazard", re.compile(r"\b(?:electrocution|electrocuted|live wire|naked wire|sparking|sparks|gas leak|collapse|collapsing|collapsed|sinkholes?|road cave-in)\b", re.IGNORECASE)),
    ("violent_threat", re.compile(r"\b(?:assault(?:ed)?|attack(?:ed)?|weapons?|guns?|knives|knife|stabbing|hostage)\b", re.IGNORECASE)),
    ("immediate_action", re.compile(r"\b(?:immediate(?:ly)? attention|act immediately)\b", re.IGNORECASE)),
]

# --- Medium Priority Patterns ---
# Substantial infrastructure failure, active utility disruptions, health nuisances, or property crime.
MEDIUM_PRIORITY_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("road_defect", re.compile(r"\b(?:potholes?|damaged? road|broken road|blocked road|open manhole|missing manhole|cracked? road|road damage)\b", re.IGNORECASE)),
    ("water_leak_or_blockage", re.compile(r"\b(?:leak(?:s|ing|age)?|burst(?:ed)?|pipe burst|overflow(?:ing|s)?|clogged|blocked drain|choked|sewage|sewer|no water|low pressure|water cut|contaminated?|contamination|dirty water)\b", re.IGNORECASE)),
    ("waste_nuisance", re.compile(r"\b(?:garbages?|trash|waste|dump(?:ing)?|uncollected|debris|rubbish|dead animal|animal carcass|stench|foul smell|stinking|stink)\b", re.IGNORECASE)),
    ("power_disruption", re.compile(r"\b(?:power cuts?|power outages?|blackouts?|no power|no electricity|broken pole|transformer failure|voltage fluctuation|broken streetlights?|broken street lights?|streetlight (?:out|down|failure)|dark street)\b", re.IGNORECASE)),
    ("property_crime", re.compile(r"\b(?:theft|stolen|thief|thieves|burglary|burglar|vandalism|vandalized|harass(?:ment)?|eve teasing|trespass(?:ing)?)\b", re.IGNORECASE)),
    ("general_disruption", re.compile(r"\b(?:broken|damaged?|not working|non-functional|failures?|disruptions?)\b", re.IGNORECASE)),
]

# --- Low Priority Patterns ---
# Minor, routine, aesthetic, cosmetic issues, feedback, or administrative inquiries.
LOW_PRIORITY_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("minor_nuisance", re.compile(r"\b(?:flicker(?:ing)?|dim|dirty|litter(?:ing)?|noise|loud music|graffiti)\b", re.IGNORECASE)),
    ("routine_maintenance", re.compile(r"\b(?:cleaning|routine|maintenance|tree branch|pruning|paint(?:ing)?|signboards?)\b", re.IGNORECASE)),
    ("administrative", re.compile(r"\b(?:delay(?:ed)?|slow|inquiry|inquiries|request|suggestion|feedback|minor)\b", re.IGNORECASE)),
]


def determine_priority(description: Optional[str], category: Optional[str] = None) -> str:
    """Determine the priority level (High, Medium, Low) for a complaint.

    Args:
        description: Text description of the complaint.
        category: Optional category determined for the complaint.

    Returns:
        One of 'High', 'Medium', or 'Low'.
    """
    if not description or not isinstance(description, str) or not description.strip():
        return PRIORITY_LOW

    normalized_text = description.strip()

    # Rule 1: High Priority takes precedence if ANY high hazard / emergency term matches
    for rule_name, pattern in HIGH_PRIORITY_PATTERNS:
        if pattern.search(normalized_text):
            return PRIORITY_HIGH

    # Rule 2: Medium Priority if substantial disruption or non-fatal hazard matches
    for rule_name, pattern in MEDIUM_PRIORITY_PATTERNS:
        if pattern.search(normalized_text):
            return PRIORITY_MEDIUM

    # Rule 3: Defaults to Low Priority for minor issues, routine requests, or unknown text
    return PRIORITY_LOW


def explain_priority(description: Optional[str]) -> Tuple[str, List[str]]:
    """Explain the reasoning behind a priority decision (useful for debugging/logging).

    Args:
        description: Text description of the complaint.

    Returns:
        A tuple of (priority, list_of_matching_rules).
    """
    if not description or not isinstance(description, str) or not description.strip():
        return (PRIORITY_LOW, ["empty_or_incomplete_description"])

    normalized_text = description.strip()
    high_matches = [rule for rule, pat in HIGH_PRIORITY_PATTERNS if pat.search(normalized_text)]
    if high_matches:
        return (PRIORITY_HIGH, high_matches)

    med_matches = [rule for rule, pat in MEDIUM_PRIORITY_PATTERNS if pat.search(normalized_text)]
    if med_matches:
        return (PRIORITY_MEDIUM, med_matches)

    low_matches = [rule for rule, pat in LOW_PRIORITY_PATTERNS if pat.search(normalized_text)]
    if low_matches:
        return (PRIORITY_LOW, low_matches)

    return (PRIORITY_LOW, ["default_no_severity_keywords_found"])
