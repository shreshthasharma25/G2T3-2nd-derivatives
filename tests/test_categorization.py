"""Unit test suite for the categorization, priority, and department logic.

Covers:
1. Normal complaints across all categories
2. Urgent complaints (accident, danger, fire, emergency, unsafe, flood, injury, etc.)
3. Incomplete complaints (empty string, whitespace, None, vague words)
4. Unknown / out-of-scope complaints (general inquiries, gibberish, unfamiliar topics)
5. Department mappings and output format validation
"""

import sys
import unittest
from pathlib import Path

# Ensure root repository directory is in Python path for test discovery
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from categorization import (
    CATEGORY_CRIME,
    CATEGORY_DEPARTMENT_MAPPING,
    CATEGORY_ELECTRICITY,
    CATEGORY_GARBAGE,
    CATEGORY_OTHER,
    CATEGORY_ROAD,
    CATEGORY_WATER,
    DEFAULT_DEPARTMENT,
    PRIORITY_HIGH,
    PRIORITY_LOW,
    PRIORITY_MEDIUM,
    categorize_complaint,
    determine_priority,
    get_department,
    process_complaint,
)


class TestNormalComplaints(unittest.TestCase):
    """Test normal (non-emergency) complaints across different civic domains."""

    def test_normal_road_complaint(self):
        desc = "There is a large pothole on 4th cross road creating problems for daily commute."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ROAD)
        self.assertEqual(result["priority"], PRIORITY_MEDIUM)
        self.assertEqual(result["department"], "Public Works Department")

    def test_normal_garbage_complaint(self):
        desc = "Trash bins are full and garbage is overflowing on the corner near market."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_GARBAGE)
        self.assertEqual(result["priority"], PRIORITY_MEDIUM)
        self.assertEqual(result["department"], "Municipality")

    def test_normal_water_complaint(self):
        desc = "Water supply pipeline is leaking clean drinking water onto the street."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_WATER)
        self.assertEqual(result["priority"], PRIORITY_MEDIUM)
        self.assertEqual(result["department"], "Water Department")

    def test_normal_electricity_complaint(self):
        desc = "Streetlights on 8th Avenue have been broken and not working for three days."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ELECTRICITY)
        self.assertEqual(result["priority"], PRIORITY_MEDIUM)
        self.assertEqual(result["department"], "Electricity Department")

    def test_normal_crime_complaint(self):
        desc = "My bicycle was stolen from outside the apartment parking lot yesterday."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_CRIME)
        self.assertEqual(result["priority"], PRIORITY_MEDIUM)
        self.assertEqual(result["department"], "Police")

    def test_minor_routine_complaint(self):
        desc = "The street light in our lane is slightly flickering occasionally."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ELECTRICITY)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "Electricity Department")

    def test_minor_garbage_litter_complaint(self):
        desc = "Minor dry leaf litter along the walking track in the local park, routine cleaning requested."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_GARBAGE)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "Municipality")


class TestUrgentComplaints(unittest.TestCase):
    """Test high-priority / urgent complaints including explicit hazard triggers.

    Must correctly handle key urgency triggers:
    accident, danger, fire, emergency, unsafe, flood, injury.
    """

    def test_urgent_accident(self):
        desc = "Severe road accident occurred near the junction due to a missing manhole cover."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ROAD)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Public Works Department")

    def test_urgent_danger(self):
        desc = "Deep cave-in on the main road poses grave danger to passing traffic."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ROAD)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Public Works Department")

    def test_urgent_fire(self):
        desc = "Distribution transformer caught fire and sparked flames spreading to nearby trees."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ELECTRICITY)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Electricity Department")

    def test_urgent_emergency(self):
        desc = "Medical emergency vehicle blocked due to road collapse and fallen barriers."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ROAD)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Public Works Department")

    def test_urgent_unsafe(self):
        desc = "Loose high-voltage live wire hanging across the sidewalk, extremely unsafe for pedestrians."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ELECTRICITY)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Electricity Department")

    def test_urgent_flood(self):
        desc = "Severe flood after main water canal burst, residential houses completely submerged."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_WATER)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Water Department")

    def test_urgent_injury(self):
        desc = "A commuter suffered serious head injury after hitting an unbarricaded road trench."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_ROAD)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Public Works Department")

    def test_urgent_crime_assault(self):
        desc = "Violent physical assault with a knife reported near the bus terminus."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_CRIME)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "Police")


class TestIncompleteComplaints(unittest.TestCase):
    """Test handling of incomplete, empty, null, and minimal input."""

    def test_empty_string(self):
        result = process_complaint("")
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_whitespace_string(self):
        result = process_complaint("    \t\n   ")
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_none_input(self):
        result = process_complaint(None)
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_non_string_input(self):
        result = process_complaint(12345)  # type: ignore
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_single_vague_word(self):
        result = process_complaint("help")
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_single_urgent_word(self):
        result = process_complaint("Emergency!")
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "General Department")

    def test_minimal_keyword_water(self):
        result = process_complaint("water")
        self.assertEqual(result["category"], CATEGORY_WATER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "Water Department")

    def test_minimal_keyword_pothole(self):
        result = process_complaint("pothole")
        self.assertEqual(result["category"], CATEGORY_ROAD)
        self.assertEqual(result["priority"], PRIORITY_MEDIUM)
        self.assertEqual(result["department"], "Public Works Department")


class TestUnknownComplaints(unittest.TestCase):
    """Test handling of unknown, ambiguous, or out-of-scope grievances."""

    def test_general_inquiry(self):
        desc = "Hello, where can I apply for renewal of my property tax receipt?"
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_gibberish_text(self):
        desc = "asdfghjkl zxcvbnm qwertyuiop 9876543210"
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_greeting_only(self):
        desc = "Good morning municipal corporation team"
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_LOW)
        self.assertEqual(result["department"], "General Department")

    def test_unknown_with_urgent_keyword(self):
        desc = "Emergency! Mysterious unknown noise heard from an empty field at midnight."
        result = process_complaint(desc)
        self.assertEqual(result["category"], CATEGORY_OTHER)
        self.assertEqual(result["priority"], PRIORITY_HIGH)
        self.assertEqual(result["department"], "General Department")


class TestDepartmentMapping(unittest.TestCase):
    """Verify department mappings strictly match specifications."""

    def test_all_department_mappings(self):
        expected_mappings = {
            "Road / Infrastructure": "Public Works Department",
            "Garbage / Waste": "Municipality",
            "Water": "Water Department",
            "Electricity / Streetlight": "Electricity Department",
            "Crime / Safety": "Police",
            "Other": "General Department",
        }
        for category, expected_dept in expected_mappings.items():
            self.assertEqual(get_department(category), expected_dept)

    def test_unknown_category_fallback(self):
        self.assertEqual(get_department("Unknown Category XYZ"), DEFAULT_DEPARTMENT)
        self.assertEqual(get_department(""), DEFAULT_DEPARTMENT)
        self.assertEqual(get_department(None), DEFAULT_DEPARTMENT)


class TestPromptRequiredUrgentTerms(unittest.TestCase):
    """Explicitly verify all 7 urgent keywords highlighted in prompt specifications.

    Terms: accident, danger, fire, emergency, unsafe, flood, injury.
    """

    def test_term_accident(self):
        result = process_complaint("A major accident was witnessed at the roundabout.")
        self.assertEqual(result["priority"], PRIORITY_HIGH)

    def test_term_danger(self):
        result = process_complaint("There is a serious danger of collapse on the bridge.")
        self.assertEqual(result["priority"], PRIORITY_HIGH)

    def test_term_fire(self):
        result = process_complaint("Small fire observed near the garbage collection point.")
        self.assertEqual(result["priority"], PRIORITY_HIGH)

    def test_term_emergency(self):
        result = process_complaint("This is an emergency situation on the main road.")
        self.assertEqual(result["priority"], PRIORITY_HIGH)

    def test_term_unsafe(self):
        result = process_complaint("The footpath is completely broken and unsafe to walk on.")
        self.assertEqual(result["priority"], PRIORITY_HIGH)

    def test_term_flood(self):
        result = process_complaint("Rainwater created a severe flood across the street.")
        self.assertEqual(result["priority"], PRIORITY_HIGH)

    def test_term_injury(self):
        result = process_complaint("A child sustained an injury due to sharp exposed metal.")
        self.assertEqual(result["priority"], PRIORITY_HIGH)


class TestIndividualFunctions(unittest.TestCase):
    """Test individual standalone functions."""

    def test_categorize_complaint_directly(self):
        self.assertEqual(categorize_complaint("Broken water pipe"), CATEGORY_WATER)
        self.assertEqual(categorize_complaint("Illegal trash dumping"), CATEGORY_GARBAGE)
        self.assertEqual(categorize_complaint("Power outage and blackouts"), CATEGORY_ELECTRICITY)
        self.assertEqual(categorize_complaint("Chain snatching robbery"), CATEGORY_CRIME)
        self.assertEqual(categorize_complaint("Deep pothole in asphalt"), CATEGORY_ROAD)
        self.assertEqual(categorize_complaint("Random unknown complaint"), CATEGORY_OTHER)

    def test_determine_priority_directly(self):
        self.assertEqual(determine_priority("Severe accident"), PRIORITY_HIGH)
        self.assertEqual(determine_priority("Pothole on road"), PRIORITY_MEDIUM)
        self.assertEqual(determine_priority("Routine tree pruning suggestion"), PRIORITY_LOW)

    def test_get_department_directly(self):
        self.assertEqual(get_department(CATEGORY_ROAD), "Public Works Department")
        self.assertEqual(get_department(CATEGORY_GARBAGE), "Municipality")
        self.assertEqual(get_department(CATEGORY_WATER), "Water Department")
        self.assertEqual(get_department(CATEGORY_ELECTRICITY), "Electricity Department")
        self.assertEqual(get_department(CATEGORY_CRIME), "Police")
        self.assertEqual(get_department(CATEGORY_OTHER), "General Department")


if __name__ == "__main__":
    unittest.main()
