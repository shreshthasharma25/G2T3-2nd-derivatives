# Citizen Grievance Data Analysis, Pattern Detection & Urgency Scoring Module

**Owner:** YM (Data Analysis + Pattern Detection + Testing)  
**Project:** Citizen Grievance Categorisation Dashboard (`G2T3-2nd-derivatives`)  
**Technology Stack:** Python 3, Pandas, Matplotlib, Pytest  

---

> [!IMPORTANT]
> **SAMPLE / DEMO DATA NOTICE:**  
> The file `analysis/sample_complaints.csv` contains purely **synthetic sample / demo data** curated for testing and demonstrating data science and pattern detection capabilities for the Lab 7 prototype. It does **not** contain real citizen data or personally identifiable information (PII).

---

## 1. Purpose of the Analysis Module

This module represents the Data Science component of the Citizen Grievance Portal. While incoming complaints are categorized and assigned priority/department rules deterministically in real time, municipal officials and urban planners need aggregate intelligence:

- **Descriptive Analytics:** Understand overall grievance volume, seasonal trends, and breakdown by civic domain, priority level, department load, and status.
- **Explainable Pattern Detection:** Uncover repeated complaints, recurring issues, and civic hotspots without relying on opaque black-box machine learning models.
- **Urgency Scoring Engine:** Python implementation of the grievance urgency scoring algorithm (`analysis/urgency_score.py`), aligned with the frontend system (`urgencyScore.js`).
- **Actionable Visualizations:** Produce 5 presentation-ready charts for executive dashboards, civic review meetings, and academic evaluation (viva).
- **Decoupled Architecture:** Operates independently of direct database connections or backend servers, allowing safe local analysis and future API integration.

---

## 2. Input Data Schema

The module reads tabular grievance data (CSV) and flexibly accommodates optional fields:

### Baseline Required Columns:
| Column | Type | Description | Example Values |
|---|---|---|---|
| `id` | String | Unique grievance identifier | `CMP-2026-001`, `GRV-2026-004281` |
| `description` | String | Citizen's free-text issue description | `"Potholes on main stretch causing vehicular damage"` |
| `location` | String | Civic area, ward, or neighborhood | `"Salt Lake Sector V"`, `"MG Road Ward 4"` |
| `category` | String | Civic domain category | `Road / Infrastructure`, `Garbage / Waste`, `Water`, `Electricity / Streetlight`, `Crime / Safety`, `Other` |
| `priority` | String | Urgency/severity rating | `High`, `Medium`, `Low` |
| `department` | String | Assigned government entity | `Public Works Department`, `Municipality`, `Water Department`, `Electricity Department`, `Police`, `General Department` |
| `status` | String | Lifecycle state of grievance | `Submitted`, `In Progress`, `Assigned`, `Resolved` |

### Optional Extended Columns:
| Column | Type | Description | Notes |
|---|---|---|---|
| `user_id` / `userId` | String | Submitting citizen identifier | Optional; normalized automatically |
| `created_at` / `createdAt`| ISO String | Submission timestamp | Optional; normalized automatically |
| `urgency_score` / `urgencyScore` | Float | Calculated composite urgency score (0–100) | Optional; parsed numerically if present |

---

## 3. Urgency Scoring Engine (`analysis/urgency_score.py`)

The urgency score engine quantifies the civic criticality of grievances using four deterministic factors:

$$\text{Raw Score} = \text{Severity Weight} + \min(\text{Concentration} \times 4, 40) + \min(\text{Recurrence} \times 5, 20)$$

$$\text{Final Urgency Score} = \min(\max(\text{Raw Score} \times \text{Population Multiplier}, 0), 100)$$

### Severity Weights:
- **Low:** 10
- **Moderate:** 30
- **High:** 70
- **Critical:** 100

### Population Impact Multipliers:
- **Low:** 0.8
- **Medium:** 1.0
- **High:** 1.2

### Dynamic Contributions:
- **Complaint Concentration:** $\min(\text{Concentration} \times 4, 40)$ (caps at 40 points)
- **Recurrence:** $\min(\text{Recurrence} \times 5, 20)$ (caps at 20 points)

### Urgency Level Classification:
| Score Range | Urgency Level |
|---|---|
| 80 – 100 | **Critical** |
| 60 – 79 | **High** |
| 40 – 59 | **Moderate** |
| 0 – 39 | **Low** |

---

## 4. Available Functions Reference

All functions are exported in `analysis/__init__.py` and implemented in `analysis/analysis.py`:

### Data Ingestion & Summary
- **`load_complaints(filepath: Optional[str | Path] = None, required_columns: Optional[List[str]] = None) -> pd.DataFrame`**  
  Loads and validates a CSV file. Normalizes aliases (`urgencyScore` $\rightarrow$ `urgency_score`), strips whitespace, and validates schema.
- **`get_total_complaints(df: pd.DataFrame) -> int`**  
  Returns total complaint count.
- **`get_summary_statistics(df: pd.DataFrame, hotspot_threshold: int = 3) -> Dict[str, Any]`**  
  Computes an executive metrics dictionary (volume, breakdowns, top drivers, urgency metrics, hotspot locations, repeated issue counts).

### Descriptive Aggregations
- **`count_by_category(df: pd.DataFrame) -> pd.Series`**  
  Counts complaints per category, sorted descending.
- **`count_by_priority(df: pd.DataFrame) -> pd.Series`**  
  Counts complaints per priority level (`High`, `Medium`, `Low`).
- **`count_by_department(df: pd.DataFrame) -> pd.Series`**  
  Counts complaints by handling department.
- **`count_by_status(df: pd.DataFrame) -> pd.Series`**  
  Counts complaints by resolution lifecycle status.
- **`count_by_location(df: pd.DataFrame) -> pd.Series`**  
  Counts complaints across all reporting locations.
- **`get_average_urgency_score(df: pd.DataFrame) -> Optional[float]`**  
  Calculates the mean urgency score if scores are available, rounded to 2 decimal places.
- **`count_high_critical_complaints(df: pd.DataFrame) -> Dict[str, int]`**  
  Identifies high-priority and critical-urgency complaints.
- **`count_repeated_complaints(df: pd.DataFrame, min_count: int = 2) -> int`**  
  Returns the count of complaints that belong to repeated issue clusters.

### Explainable Pattern Detection
- **`get_top_category(df: pd.DataFrame) -> Optional[str]`**  
  Returns the most frequently reported category.
- **`get_top_priority(df: pd.DataFrame) -> Optional[str]`**  
  Returns the most common priority level.
- **`get_top_department(df: pd.DataFrame) -> Optional[str]`**  
  Returns the department receiving the most complaints.
- **`get_top_locations(df: pd.DataFrame, n: int = 5) -> pd.Series`**  
  Returns the top $n$ locations with the highest number of complaints.
- **`find_repeated_complaints(df: pd.DataFrame, min_count: int = 2) -> pd.DataFrame`**  
  Identifies repeated complaints occurring within the same geographic location and category.
- **`find_hotspots(df: pd.DataFrame, threshold: int = 3) -> pd.DataFrame`**  
  Identifies civic hotspots where complaint volume meets or exceeds the threshold. Returns volume, percentage share, dominant category, and high-priority count.
- **`find_priority_concentration(df: pd.DataFrame, priority: str = "High", threshold: int = 2) -> pd.DataFrame`**  
  Identifies locations experiencing multiple high-severity emergencies.
- **`find_unusually_frequent_categories(df: pd.DataFrame, threshold_factor: float = 1.3) -> pd.DataFrame`**  
  Identifies categories whose complaint volume exceeds the average baseline by the threshold factor.
- **`find_recurring_patterns(df: pd.DataFrame, min_count: int = 2) -> pd.DataFrame`**  
  Synthesizes repeated issue clusters with urgency metrics to provide actionable operational insights.

### Urgency Scoring Engine (`analysis/urgency_score.py`)
- **`calculate_urgency_score(severity: str, complaint_concentration: int, recurrence: int, population_impact: str) -> float`**  
  Calculates composite urgency score capped between 0 and 100.
- **`get_urgency_level(score: float) -> str`**  
  Maps numeric score to category band (`Critical`, `High`, `Moderate`, `Low`).

### Visualizations
- **`generate_charts(df: pd.DataFrame, output_dir: Optional[str | Path] = None) -> List[Path]`**  
  Generates 5 high-resolution (150 DPI) Matplotlib figures into `analysis/charts/`:
  1. `complaints_by_category.png` (Horizontal bar chart of volume per category)
  2. `complaints_by_priority.png` (Color-coded bar chart with percentage labels)
  3. `complaints_by_department.png` (Workload volume per municipal department)
  4. `complaints_by_location.png` (Horizontal bar chart spotlighting hotspots $\ge 3$)
  5. `urgency_score_distribution.png` (Urgency score band histogram: Low, Moderate, High, Critical)

---

## 5. Key Concepts Explained

### What are "Repeated Complaints"?
A **repeated complaint** occurs when two or more grievances originate from the **same location** and concern the **same civic category** (for example, multiple citizens reporting broken streetlights in *Salt Lake Sector V*).

- **Civic Significance:** Repeated complaints indicate systemic infrastructure failures, unaddressed backlogs, and growing neighborhood frustration.
- **Detection Method:** Grouping by `['location', 'category']` where `count >= min_count` (default: 2).

### What is a "Hotspot"?
A **civic hotspot** is a specific geographic area or ward that exhibits a disproportionately high density of grievances compared to other areas (by default, `count >= 3`).

- **Civic Significance:** Enables municipal managers to allocate repair crews proactively to high-density zones rather than reacting to isolated tickets.
- **Detection Method:** Aggregating complaint frequencies by `location` and filtering by configurable threshold `threshold` (default: 3).

### What is "Priority Concentration"?
A **priority concentration** is a location where multiple **High-priority** complaints occur simultaneously (e.g., live electrical wires, pipeline bursts, open manholes).

- **Civic Significance:** Allows emergency dispatchers to triage life-threatening situations ahead of routine aesthetic grievances.

---

## 6. How to Run the Analysis

### 1. Install Dependencies
```powershell
python -m pip install -r analysis/requirements.txt
```
*(Or directly: `python -m pip install --user pandas matplotlib pytest`)*

### 2. Run Analysis & Generate Charts
Execute the analysis script directly from the repository root:
```powershell
# Analyze default sample complaints (sample_complaints.csv)
python analysis/analysis.py

# Or analyze any custom complaints CSV file:
python analysis/analysis.py path/to/complaints.csv
```
This prints the formatted terminal report and saves all 5 PNG charts in `analysis/charts/`.

---

## 7. How to Run the Tests

To run the analysis test suite using `pytest`:
```powershell
python -m pytest tests/test_analysis.py -v
```

To run all project tests (both YG's categorization tests and YM's analysis tests):
```powershell
python -m pytest tests/ -v
```

---

## 8. Limitations & Assumptions

1. **Sample Data:** The included `sample_complaints.csv` contains 25 synthetic records for demonstration purposes. In production, this module can consume real citizen data exported directly from Supabase or via the frontend CSV export button.
2. **Text Normalization:** Location matching is currently based on clean string matching with trimmed whitespace. In a future production iteration, fuzzy matching or geospatial coordinates (latitude/longitude) can be incorporated.
3. **Deterministic Rules:** Analysis relies on transparent, deterministic aggregation without opaque ML weights, ensuring full reproducibility and explainability during audits and viva assessments.
