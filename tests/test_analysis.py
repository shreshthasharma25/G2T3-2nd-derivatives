"""Comprehensive Test Suite for Data Analysis and Pattern Detection Module.

Owner: YM (Data Analysis + Pattern Detection + Testing)

Covers all 11 core verification requirements:
1. Total complaint counting (get_total_complaints)
2. Breakdown counting by category (count_by_category)
3. Breakdown counting by priority (count_by_priority)
4. Breakdown counting by department (count_by_department)
5. Breakdown counting by location (count_by_location)
6. Repeated complaint detection (find_repeated_complaints, count_repeated_complaints)
7. Top category detection (get_top_category)
8. Top location ranking (get_top_locations)
9. High & Critical severity identification (count_high_critical_complaints)
10. Empty dataset resilience (graceful handling across all functions)
11. Missing optional fields handling (tolerating missing urgency_score, user_id, created_at, status)
12. Urgency scoring engine verification (weights, caps, and bands matching urgencyScore.js)
13. Automated chart generation file assertions (5 PNG files)
"""

import sys
from pathlib import Path
import pytest
import pandas as pd

# Add repo root to sys.path to ensure module imports succeed under any runner
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from analysis import (
    CORE_COLUMNS,
    EXPECTED_COLUMNS,
    POPULATION_WEIGHTS,
    REQUIRED_COLUMNS,
    SEVERITY_WEIGHTS,
    VALID_CATEGORIES,
    VALID_DEPARTMENTS,
    VALID_PRIORITIES,
    calculate_urgency_score,
    count_by_category,
    count_by_department,
    count_by_location,
    count_by_priority,
    count_by_status,
    count_high_critical_complaints,
    count_repeated_complaints,
    find_hotspots,
    find_priority_concentration,
    find_recurring_patterns,
    find_repeated_complaints,
    find_unusually_frequent_categories,
    generate_charts,
    get_average_urgency_score,
    get_summary_statistics,
    get_top_category,
    get_top_department,
    get_top_locations,
    get_top_priority,
    get_total_complaints,
    get_urgency_level,
    load_complaints,
)


@pytest.fixture
def sample_df():
    """Fixture providing the default sample complaints DataFrame."""
    return load_complaints()


@pytest.fixture
def dummy_df():
    """Fixture providing a minimal, controlled DataFrame for deterministic logic tests."""
    data = {
        "id": ["T-01", "T-02", "T-03", "T-04", "T-05", "T-06"],
        "description": [
            "Pothole issue 1",
            "Pothole issue 2",
            "Pothole issue 3",
            "Garbage accumulation",
            "Live sparking wire",
            "Broken streetlight",
        ],
        "location": ["Area Alpha", "Area Alpha", "Area Alpha", "Area Beta", "Area Beta", "Area Gamma"],
        "category": [
            "Road / Infrastructure",
            "Road / Infrastructure",
            "Road / Infrastructure",
            "Garbage / Waste",
            "Electricity / Streetlight",
            "Electricity / Streetlight",
        ],
        "priority": ["Medium", "High", "High", "Medium", "High", "Low"],
        "department": [
            "Public Works Department",
            "Public Works Department",
            "Public Works Department",
            "Municipality",
            "Electricity Department",
            "Electricity Department",
        ],
        "status": ["Submitted", "In Progress", "Resolved", "Submitted", "Assigned", "Resolved"],
        "urgency_score": [55.0, 85.0, 78.0, 42.0, 88.0, 25.0],
    }
    return pd.DataFrame(data)


# ============================================================================
# 1. CSV LOADING & SCHEMA TESTS
# ============================================================================

class TestCSVLoading:
    """Tests for CSV loading, error handling, and column validation."""

    def test_load_default_sample_complaints(self, sample_df):
        """Verify that default sample_complaints.csv loads cleanly into a non-empty DataFrame."""
        assert isinstance(sample_df, pd.DataFrame)
        assert not sample_df.empty
        assert len(sample_df) == 25

    def test_required_columns_present(self, sample_df):
        """Verify all mandatory columns are present in loaded dataset."""
        for col in REQUIRED_COLUMNS:
            assert col in sample_df.columns, f"Missing required column: {col}"

    def test_file_not_found_raises_error(self, tmp_path):
        """Verify FileNotFoundError is raised when target CSV does not exist."""
        non_existent = tmp_path / "does_not_exist.csv"
        with pytest.raises(FileNotFoundError):
            load_complaints(non_existent)

    def test_missing_columns_raises_error(self, tmp_path):
        """Verify ValueError is raised if CSV is missing required schema columns."""
        invalid_csv = tmp_path / "invalid.csv"
        invalid_csv.write_text("id,description,location\n1,desc,loc\n")
        with pytest.raises(ValueError, match="missing required columns"):
            load_complaints(invalid_csv)

    def test_empty_file_raises_error(self, tmp_path):
        """Verify ValueError is raised when CSV is empty."""
        empty_csv = tmp_path / "empty.csv"
        empty_csv.write_text("id,description,location,category,priority,department,status\n")
        with pytest.raises(ValueError, match="empty"):
            load_complaints(empty_csv)

    def test_load_flexible_custom_required_columns(self, tmp_path):
        """Verify load_complaints works when specifying a custom subset of required columns."""
        custom_csv = tmp_path / "custom.csv"
        custom_csv.write_text("location,category\nWard 1,Water\n")
        df = load_complaints(custom_csv, required_columns=["location", "category"])
        assert len(df) == 1
        assert "location" in df.columns


# ============================================================================
# 2. DESCRIPTIVE AGGREGATION TESTS
# ============================================================================

class TestDescriptiveAggregations:
    """Tests for counting and aggregation across civic dimensions."""

    def test_get_total_complaints(self, sample_df, dummy_df):
        """Verify total complaint count calculation."""
        assert get_total_complaints(sample_df) == 25
        assert get_total_complaints(dummy_df) == 6
        assert get_total_complaints(pd.DataFrame()) == 0

    def test_count_by_category(self, sample_df):
        """Verify category breakdown covers valid categories and sums to total."""
        cat_counts = count_by_category(sample_df)
        assert isinstance(cat_counts, pd.Series)
        assert cat_counts.sum() == len(sample_df)
        assert "Electricity / Streetlight" in cat_counts
        assert "Road / Infrastructure" in cat_counts
        assert "Water" in cat_counts
        assert "Garbage / Waste" in cat_counts
        assert "Crime / Safety" in cat_counts
        assert "Other" in cat_counts

    def test_count_by_priority(self, sample_df):
        """Verify priority counts match High, Medium, Low totals."""
        pri_counts = count_by_priority(sample_df)
        assert pri_counts.sum() == len(sample_df)
        assert "High" in pri_counts
        assert "Medium" in pri_counts
        assert "Low" in pri_counts
        assert pri_counts["High"] == 11
        assert pri_counts["Medium"] == 8
        assert pri_counts["Low"] == 6

    def test_count_by_department(self, sample_df):
        """Verify department counts sum to total and cover key departments."""
        dep_counts = count_by_department(sample_df)
        assert dep_counts.sum() == len(sample_df)
        assert "Electricity Department" in dep_counts
        assert "Public Works Department" in dep_counts
        assert "Water Department" in dep_counts
        assert "Municipality" in dep_counts
        assert "Police" in dep_counts
        assert "General Department" in dep_counts

    def test_count_by_status(self, sample_df):
        """Verify status counts cover standard lifecycle states."""
        stat_counts = count_by_status(sample_df)
        assert stat_counts.sum() == len(sample_df)
        assert "Submitted" in stat_counts
        assert "In Progress" in stat_counts
        assert "Resolved" in stat_counts

    def test_count_by_location(self, sample_df):
        """Verify location aggregation returns top locations accurately."""
        loc_counts = count_by_location(sample_df)
        assert loc_counts.sum() == len(sample_df)
        assert loc_counts["Salt Lake Sector V"] == 5
        assert loc_counts["MG Road Ward 4"] == 4
        assert loc_counts["Civil Lines Sector 2"] == 4

    def test_get_average_urgency_score(self, sample_df, dummy_df):
        """Verify calculation of average urgency score."""
        avg_score = get_average_urgency_score(sample_df)
        assert avg_score is not None
        assert 0 <= avg_score <= 100

        # dummy_df: [55.0, 85.0, 78.0, 42.0, 88.0, 25.0] -> sum = 373 -> mean = 62.17
        assert get_average_urgency_score(dummy_df) == 62.17

    def test_get_average_urgency_score_missing(self):
        """Verify returns None when urgency_score column is missing or empty."""
        df_no_urg = pd.DataFrame({"location": ["A"], "category": ["Water"]})
        assert get_average_urgency_score(df_no_urg) is None
        assert get_average_urgency_score(pd.DataFrame()) is None

    def test_count_high_critical_complaints(self, sample_df, dummy_df):
        """Verify detection of high and critical severity complaints."""
        counts = count_high_critical_complaints(sample_df)
        assert isinstance(counts, dict)
        assert counts["high_priority_count"] == 11
        assert counts["total_high_or_critical"] >= 11

        # dummy_df has 3 High priorities and 3 urgency scores >= 60 (85, 78, 88)
        dummy_counts = count_high_critical_complaints(dummy_df)
        assert dummy_counts["high_priority_count"] == 3
        assert dummy_counts["critical_urgency_count"] == 2  # 85 and 88 >= 80
        assert dummy_counts["high_urgency_count"] == 1      # 78 is between 60 and 79

    def test_count_repeated_complaints(self, dummy_df, sample_df):
        """Verify count of complaints belonging to repeated clusters."""
        # dummy_df has Area Alpha (Road / Infrastructure) with 3 complaints
        assert count_repeated_complaints(dummy_df, min_count=2) == 3
        # sample_df has multiple clusters totaling 16 complaints
        assert count_repeated_complaints(sample_df, min_count=2) >= 14


# ============================================================================
# 3. PATTERN DETECTION & HOTSPOT TESTS
# ============================================================================

class TestPatternDetection:
    """Tests for pattern detection, ranking, and hotspot identification."""

    def test_get_top_category(self, sample_df, dummy_df):
        """Verify retrieval of top complaint category."""
        assert get_top_category(sample_df) == "Electricity / Streetlight"
        assert get_top_category(dummy_df) == "Road / Infrastructure"
        assert get_top_category(pd.DataFrame()) is None

    def test_get_top_priority(self, sample_df, dummy_df):
        """Verify retrieval of most common priority level."""
        assert get_top_priority(sample_df) == "High"
        assert get_top_priority(dummy_df) == "High"
        assert get_top_priority(pd.DataFrame()) is None

    def test_get_top_department(self, sample_df, dummy_df):
        """Verify retrieval of department with the most complaints."""
        assert get_top_department(sample_df) == "Electricity Department"
        assert get_top_department(dummy_df) == "Public Works Department"
        assert get_top_department(pd.DataFrame()) is None

    def test_get_top_locations(self, sample_df):
        """Verify top locations ranking."""
        top_locs = get_top_locations(sample_df, n=3)
        assert len(top_locs) == 3
        assert top_locs.index[0] == "Salt Lake Sector V"
        assert top_locs.iloc[0] == 5

    def test_find_repeated_complaints(self, dummy_df):
        """Verify repeated complaint detection groups by location and category."""
        repeated = find_repeated_complaints(dummy_df, min_count=2)
        assert len(repeated) == 1
        assert repeated.iloc[0]["location"] == "Area Alpha"
        assert repeated.iloc[0]["category"] == "Road / Infrastructure"
        assert repeated.iloc[0]["complaint_count"] == 3
        assert repeated.iloc[0]["complaint_ids"] == ["T-01", "T-02", "T-03"]

    def test_find_repeated_complaints_sample_data(self, sample_df):
        """Verify repeated complaints on the realistic sample complaints dataset."""
        repeated = find_repeated_complaints(sample_df, min_count=2)
        assert len(repeated) >= 6
        civil_lines = repeated[
            (repeated["location"] == "Civil Lines Sector 2") &
            (repeated["category"] == "Garbage / Waste")
        ]
        assert not civil_lines.empty
        assert civil_lines.iloc[0]["complaint_count"] == 4

    def test_find_hotspots_default_threshold(self, sample_df):
        """Verify hotspots detected with threshold >= 3 in sample data."""
        hotspots = find_hotspots(sample_df, threshold=3)
        assert isinstance(hotspots, pd.DataFrame)
        hotspot_locs = hotspots["location"].tolist()

        expected = [
            "Salt Lake Sector V",
            "Civil Lines Sector 2",
            "MG Road Ward 4",
            "Indira Nagar 5th Block",
            "Park Street Central Zone",
        ]
        for loc in expected:
            assert loc in hotspot_locs

        assert "Nehru Place Block A" not in hotspot_locs

    def test_find_hotspots_custom_threshold(self, dummy_df):
        """Verify configurable threshold for hotspot identification."""
        hotspots_3 = find_hotspots(dummy_df, threshold=3)
        assert len(hotspots_3) == 1
        assert hotspots_3.iloc[0]["location"] == "Area Alpha"

        hotspots_2 = find_hotspots(dummy_df, threshold=2)
        assert len(hotspots_2) == 2
        assert set(hotspots_2["location"]) == {"Area Alpha", "Area Beta"}

        hotspots_10 = find_hotspots(dummy_df, threshold=10)
        assert hotspots_10.empty

    def test_find_priority_concentration(self, sample_df):
        """Verify high-priority concentration detects locations with >= 2 High complaints."""
        concentration = find_priority_concentration(sample_df, priority="High", threshold=2)
        assert isinstance(concentration, pd.DataFrame)
        locs = concentration["location"].tolist()

        assert "Park Street Central Zone" in locs
        assert "Civil Lines Sector 2" in locs
        assert "Indira Nagar 5th Block" in locs
        assert "Nehru Place Block A" in locs
        assert all(count >= 2 for count in concentration["priority_count"])

    def test_find_unusually_frequent_categories(self, sample_df):
        """Verify detection of categories exceeding volume baseline."""
        unusual = find_unusually_frequent_categories(sample_df, threshold_factor=1.3)
        assert isinstance(unusual, pd.DataFrame)
        if not unusual.empty:
            assert "category" in unusual.columns
            assert "frequency_ratio" in unusual.columns
            assert all(unusual["frequency_ratio"] >= 1.3)

    def test_find_recurring_patterns(self, sample_df):
        """Verify recurring patterns analysis with urgency metric enrichment."""
        patterns = find_recurring_patterns(sample_df, min_count=2)
        assert isinstance(patterns, pd.DataFrame)
        assert not patterns.empty
        assert "location" in patterns.columns
        assert "complaint_count" in patterns.columns
        assert "avg_urgency_score" in patterns.columns


# ============================================================================
# 4. RESILIENCE & EDGE CASE TESTS (EMPTY & MISSING OPTIONAL FIELDS)
# ============================================================================

class TestResilienceAndEdgeCases:
    """Tests guaranteeing that functions do not crash on empty data or missing optional fields."""

    def test_empty_dataframe_handling(self):
        """Verify all descriptive and pattern functions handle empty DataFrame gracefully."""
        empty_df = pd.DataFrame(columns=REQUIRED_COLUMNS)
        assert get_total_complaints(empty_df) == 0
        assert count_by_category(empty_df).empty
        assert count_by_priority(empty_df).empty
        assert count_by_department(empty_df).empty
        assert count_by_status(empty_df).empty
        assert count_by_location(empty_df).empty
        assert get_average_urgency_score(empty_df) is None
        assert count_repeated_complaints(empty_df) == 0
        assert get_top_category(empty_df) is None
        assert get_top_priority(empty_df) is None
        assert get_top_department(empty_df) is None
        assert get_top_locations(empty_df).empty
        assert find_repeated_complaints(empty_df).empty
        assert find_hotspots(empty_df).empty
        assert find_priority_concentration(empty_df).empty
        assert find_unusually_frequent_categories(empty_df).empty
        assert find_recurring_patterns(empty_df).empty

        summary = get_summary_statistics(empty_df)
        assert summary["total_complaints"] == 0
        assert summary["top_category"] is None
        assert summary["hotspot_locations"] == []

    def test_missing_optional_fields_handling(self):
        """Verify analysis operates cleanly when optional fields are omitted.

        Omitted fields: urgency_score, user_id, created_at, status.
        Only core fields present: id, description, location, category, priority, department.
        """
        data = {
            "id": ["M-1", "M-2", "M-3"],
            "description": ["Water leak", "Water pipe burst", "Broken pole"],
            "location": ["Ward 5", "Ward 5", "Ward 6"],
            "category": ["Water", "Water", "Electricity / Streetlight"],
            "priority": ["High", "High", "Low"],
            "department": ["Water Department", "Water Department", "Electricity Department"],
        }
        df_minimal = pd.DataFrame(data)

        # Descriptive functions must work without crashing
        assert get_total_complaints(df_minimal) == 3
        assert count_by_category(df_minimal)["Water"] == 2
        assert count_by_priority(df_minimal)["High"] == 2
        assert count_by_department(df_minimal)["Water Department"] == 2
        assert count_by_status(df_minimal).empty  # status missing, returns empty series
        assert count_by_location(df_minimal)["Ward 5"] == 2
        assert get_average_urgency_score(df_minimal) is None

        # Pattern detection must work without crashing
        assert get_top_category(df_minimal) == "Water"
        assert get_top_priority(df_minimal) == "High"
        assert get_top_department(df_minimal) == "Water Department"
        assert len(find_repeated_complaints(df_minimal, min_count=2)) == 1

        # Summary statistics must generate cleanly
        summary = get_summary_statistics(df_minimal)
        assert summary["total_complaints"] == 3
        assert summary["top_category"] == "Water"
        assert summary["average_urgency_score"] is None
        assert summary["high_priority_count"] == 2


# ============================================================================
# 5. SUMMARY STATISTICS TESTS
# ============================================================================

class TestSummaryStatistics:
    """Tests for executive summary statistics computation."""

    def test_summary_statistics_structure(self, sample_df):
        """Verify summary statistics dictionary contains all required metrics."""
        summary = get_summary_statistics(sample_df)
        assert summary["total_complaints"] == 25
        assert summary["top_category"] == "Electricity / Streetlight"
        assert summary["top_department"] == "Electricity Department"
        assert summary["top_location"] == "Salt Lake Sector V"
        assert summary["high_priority_count"] == 11
        assert summary["high_priority_percentage"] == 44.0
        assert len(summary["hotspot_locations"]) == 5
        assert summary["repeated_complaint_groups"] == 7
        assert summary["repeated_complaint_count"] >= 14
        assert summary["average_urgency_score"] is not None


# ============================================================================
# 6. URGENCY SCORE ENGINE TESTS
# ============================================================================

class TestUrgencyScoreEngine:
    """Tests for deterministic urgency score calculation matching urgencyScore.js."""

    def test_severity_weights_mapping(self):
        """Verify severity weights match system specification."""
        assert SEVERITY_WEIGHTS["Low"] == 10
        assert SEVERITY_WEIGHTS["Moderate"] == 30
        assert SEVERITY_WEIGHTS["High"] == 70
        assert SEVERITY_WEIGHTS["Critical"] == 100

    def test_population_weights_mapping(self):
        """Verify population impact multipliers."""
        assert POPULATION_WEIGHTS["Low"] == 0.8
        assert POPULATION_WEIGHTS["Medium"] == 1.0
        assert POPULATION_WEIGHTS["High"] == 1.2

    def test_calculate_urgency_score_baseline(self):
        """Verify calculation: severity 10, conc 1, rec 1, pop Medium (1.0).

        conc contribution: min(1 * 4, 40) = 4
        rec contribution: min(1 * 5, 20) = 5
        raw: 10 + 4 + 5 = 19
        final: 19 * 1.0 = 19.0
        """
        score = calculate_urgency_score(
            severity="Low",
            complaint_concentration=1,
            recurrence=1,
            population_impact="Medium",
        )
        assert score == 19.0

    def test_calculate_urgency_score_with_multipliers_and_caps(self):
        """Verify score calculation with population multiplier and upper cap (100).

        severity High (70), conc 10 (min(40, 40) = 40), rec 4 (min(20, 20) = 20)
        raw = 70 + 40 + 20 = 130
        final = 130 * 1.2 (High pop) = 156 -> capped at 100.0
        """
        score = calculate_urgency_score(
            severity="High",
            complaint_concentration=10,
            recurrence=4,
            population_impact="High",
        )
        assert score == 100.0

    def test_get_urgency_level_bands(self):
        """Verify level mapping: Critical (80-100), High (60-79), Moderate (40-59), Low (0-39)."""
        assert get_urgency_level(100) == "Critical"
        assert get_urgency_level(85) == "Critical"
        assert get_urgency_level(80) == "Critical"
        assert get_urgency_level(79) == "High"
        assert get_urgency_level(60) == "High"
        assert get_urgency_level(59) == "Moderate"
        assert get_urgency_level(40) == "Moderate"
        assert get_urgency_level(39) == "Low"
        assert get_urgency_level(0) == "Low"


# ============================================================================
# 7. CHART GENERATION TESTS
# ============================================================================

class TestChartGeneration:
    """Tests for automated Matplotlib chart creation and file persistence."""

    def test_generate_charts_all_five(self, sample_df, tmp_path):
        """Verify all 5 charts are created on disk with valid file sizes when urgency score is present."""
        generated = generate_charts(sample_df, output_dir=tmp_path)
        assert len(generated) == 5

        expected_filenames = [
            "complaints_by_category.png",
            "complaints_by_priority.png",
            "complaints_by_department.png",
            "complaints_by_location.png",
            "urgency_score_distribution.png",
        ]

        for filename in expected_filenames:
            chart_path = tmp_path / filename
            assert chart_path.exists(), f"Expected chart missing: {filename}"
            # File should not be empty (should be a valid PNG image > 10KB)
            assert chart_path.stat().st_size > 10000

    def test_generate_charts_without_urgency_score(self, tmp_path):
        """Verify that when urgency score is missing, the 4 standard charts are generated without error."""
        df_no_urg = pd.DataFrame({
            "id": ["C1", "C2"],
            "location": ["Area A", "Area B"],
            "category": ["Water", "Garbage / Waste"],
            "priority": ["High", "Low"],
            "department": ["Water Department", "Municipality"],
        })
        generated = generate_charts(df_no_urg, output_dir=tmp_path)
        assert len(generated) == 4
        filenames = [p.name for p in generated]
        assert "complaints_by_category.png" in filenames
        assert "complaints_by_priority.png" in filenames
        assert "complaints_by_department.png" in filenames
        assert "complaints_by_location.png" in filenames
        assert "urgency_score_distribution.png" not in filenames
