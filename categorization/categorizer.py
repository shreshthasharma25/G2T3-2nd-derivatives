"""Complaint categorization module for citizen grievances.

Determines the appropriate category for a civic complaint using deterministic,
explainable rule-based keyword and phrase matching.
"""

import re
from typing import Dict, List, Optional, Tuple

# Supported civic categories
CATEGORY_ROAD = "Road / Infrastructure"
CATEGORY_GARBAGE = "Garbage / Waste"
CATEGORY_WATER = "Water"
CATEGORY_ELECTRICITY = "Electricity / Streetlight"
CATEGORY_CRIME = "Crime / Safety"
CATEGORY_OTHER = "Other"

VALID_CATEGORIES = (
    CATEGORY_ROAD,
    CATEGORY_GARBAGE,
    CATEGORY_WATER,
    CATEGORY_ELECTRICITY,
    CATEGORY_CRIME,
    CATEGORY_OTHER,
)

# Rule definitions: (category, weight, regex_pattern)
# Higher weights (3-4) are assigned to specific multi-word domain phrases.
# Lower weights (1-2) are assigned to generic domain terms.
CATEGORY_RULES: List[Tuple[str, int, re.Pattern]] = [
    # --- Road / Infrastructure ---
    (CATEGORY_ROAD, 4, re.compile(r"\b(?:road cave-in|sinkholes?|open manhole|missing manhole|manhole cover|zebra crossing|pedestrian crossing|speed breakers?|speed bumps?|traffic signals?|traffic lights?)\b", re.IGNORECASE)),
    (CATEGORY_ROAD, 3, re.compile(r"\b(?:potholes?|footpaths?|sidewalks?|pavements?|flyovers?|bridges?|overpasses?|underpasses?|culverts?|asphalt|tar road|road divider|median barrier|curb|kerb)\b", re.IGNORECASE)),
    (CATEGORY_ROAD, 3, re.compile(r"\b(?:road damage|damaged road|broken road|blocked road|road repair|cracked road)\b", re.IGNORECASE)),
    (CATEGORY_ROAD, 2, re.compile(r"\b(?:manholes?|barricades?|paving)\b", re.IGNORECASE)),
    (CATEGORY_ROAD, 1, re.compile(r"\b(?:roads?|streets?|highways?|lanes?|alleys?|expressways?)\b", re.IGNORECASE)),

    # --- Garbage / Waste ---
    (CATEGORY_GARBAGE, 4, re.compile(r"\b(?:overflowing bins?|overflowing dustbins?|illegal dumping|dumping site|open dump|uncollected (?:garbage|waste|trash)|(?:garbage|trash|waste) accumulation|animal carcass|dead animal|solid waste|plastic waste|biomedical waste)\b", re.IGNORECASE)),
    (CATEGORY_GARBAGE, 3, re.compile(r"\b(?:garbage bins?|waste bins?|trash cans?|trashcans?|dustbins?|garbage pile|trash pile|waste pile|pile of (?:garbage|trash|waste))\b", re.IGNORECASE)),
    (CATEGORY_GARBAGE, 3, re.compile(r"\b(?:foul smell|bad smell|stinking smell|stench|stinking|stink)\b", re.IGNORECASE)),
    (CATEGORY_GARBAGE, 2, re.compile(r"\b(?:garbage|trash|waste|rubbish|debris|refuse|litter|littering|sanitation|dump|dumping|compost)\b", re.IGNORECASE)),

    # --- Water ---
    (CATEGORY_WATER, 4, re.compile(r"\b(?:water supply|water pipeline|pipeline burst|pipe burst|burst pipe|broken pipe|leaking pipe|pipe leakage|pipeline leakage|drinking water|tap water|potable water|no water|water shortage|low water pressure)\b", re.IGNORECASE)),
    (CATEGORY_WATER, 4, re.compile(r"\b(?:contaminated water|water contamination|dirty water|polluted water|muddy water|sewage backflow|sewage overflow|open sewer|open drain)\b", re.IGNORECASE)),
    (CATEGORY_WATER, 3, re.compile(r"\b(?:waterlogging|water logging|water stagnation|stagnant water|floods?|flooding|submerged|storm drain|clogged drain|blocked drain|choked drain|overflowing drain|sewer lines?|sewerage)\b", re.IGNORECASE)),
    (CATEGORY_WATER, 2, re.compile(r"\b(?:pipeline|drains?|drainage|sewers?|sewage|gutters?|borewell|sump|water tanker)\b", re.IGNORECASE)),
    (CATEGORY_WATER, 2, re.compile(r"\b(?:water)\b", re.IGNORECASE)),

    # --- Electricity / Streetlight ---
    (CATEGORY_ELECTRICITY, 4, re.compile(r"\b(?:street lights?|streetlights?|street lamps?|lamp posts?|lampposts?|electric poles?|electricity poles?|power poles?|light poles?)\b", re.IGNORECASE)),
    (CATEGORY_ELECTRICITY, 4, re.compile(r"\b(?:power cuts?|power outages?|blackouts?|no power|no electricity|power failure|voltage fluctuation|high voltage|low voltage|short circuit)\b", re.IGNORECASE)),
    (CATEGORY_ELECTRICITY, 4, re.compile(r"\b(?:sparking transformer|transformer blast|sparking wire|live wire|hanging wire|loose wire|snapped wire|naked wire|high-voltage wire|electric wire|electric shock|electrocution|electrocuted)\b", re.IGNORECASE)),
    (CATEGORY_ELECTRICITY, 3, re.compile(r"\b(?:broken streetlight|streetlight failure|flickering (?:streetlight|lamp|light)|meter box|electric meter|fuse box|fuse blown|substation|transformers?)\b", re.IGNORECASE)),
    (CATEGORY_ELECTRICITY, 2, re.compile(r"\b(?:electricity|electric|electrical|wires?|cables?|wiring)\b", re.IGNORECASE)),

    # --- Crime / Safety ---
    (CATEGORY_CRIME, 4, re.compile(r"\b(?:armed robbery|chain snatching|pickpocketing|pickpocket|house break-in|sexual harassment|eve teasing|molestation|molest|physical assault|death threat|threat to life|illegal drugs|drug peddling|illicit liquor|gambling den)\b", re.IGNORECASE)),
    (CATEGORY_CRIME, 3, re.compile(r"\b(?:theft|stolen|thief|thieves|robbery|robbed|burglar|burglary|assault|assaulted|brawls?|fighting|weapons?|guns?|pistols?|knives|knife|firearms?)\b", re.IGNORECASE)),
    (CATEGORY_CRIME, 3, re.compile(r"\b(?:vandalism|vandalized|extortion|blackmail|stalking|stalker|trespassing|trespasser|hooligans?|gang activity|police complaint)\b", re.IGNORECASE)),
    (CATEGORY_CRIME, 2, re.compile(r"\b(?:crime|criminals?|violence|attackers?|harass|harassment|threat|threats|threatened)\b", re.IGNORECASE)),
]

# Tie-break priority order (most critical public safety domains take precedence in exact ties)
TIE_BREAK_ORDER = [
    CATEGORY_CRIME,
    CATEGORY_ELECTRICITY,
    CATEGORY_WATER,
    CATEGORY_ROAD,
    CATEGORY_GARBAGE,
    CATEGORY_OTHER,
]


def score_complaint(description: str) -> Dict[str, int]:
    """Calculate match scores across all categories for the given description.

    Args:
        description: Text description of the complaint.

    Returns:
        Dict mapping each category name to its calculated score.
    """
    scores: Dict[str, int] = {cat: 0 for cat in VALID_CATEGORIES}

    if not description or not isinstance(description, str) or not description.strip():
        return scores

    normalized_text = description.strip()

    for category, weight, pattern in CATEGORY_RULES:
        matches = pattern.findall(normalized_text)
        if matches:
            scores[category] += weight * len(matches)

    return scores


def categorize_complaint(description: Optional[str]) -> str:
    """Categorize a citizen complaint based on its description.

    Uses deterministic rule-based matching. If no specific category matches
    or the input is empty/invalid/unintelligible, it defaults to 'Other'.

    Args:
        description: Text description of the complaint.

    Returns:
        The category string (one of VALID_CATEGORIES).
    """
    if not description or not isinstance(description, str) or not description.strip():
        return CATEGORY_OTHER

    scores = score_complaint(description)

    # Filter out categories with zero score
    positive_scores = {cat: score for cat, score in scores.items() if score > 0 and cat != CATEGORY_OTHER}

    if not positive_scores:
        return CATEGORY_OTHER

    # Find maximum score
    max_score = max(positive_scores.values())

    # Get all categories that achieved the maximum score
    candidates = [cat for cat, score in positive_scores.items() if score == max_score]

    if len(candidates) == 1:
        return candidates[0]

    # Resolve tie deterministically using predefined hierarchy
    for cat in TIE_BREAK_ORDER:
        if cat in candidates:
            return cat

    return candidates[0]
