"""Citizen Grievance Data Analysis and Pattern Detection Module.

Owner: YM (Data Analysis + Pattern Detection + Testing)

This module provides explainable, rule-aligned data analysis and pattern detection
for civic complaints using Python, Pandas, and Matplotlib. It operates on tabular
complaint data (such as sample_complaints.csv or exported user complaints) and generates:
1. Descriptive aggregate statistics:
   - Total complaints
   - Breakdown by category, priority, department, status, and location
   - Average urgency score (when urgency scores are available)
   - High and Critical severity counts
   - Repeated complaint counts
2. Deterministic pattern detection:
   - Most frequent category, priority, department, and top locations
   - Repeated complaints from the same location
   - High-priority complaint concentration
   - Categories with unusually high complaint frequency
   - Geographic/locality hotspots based on complaint volume
   - Recurring complaint patterns
3. Clear, presentation-ready visualizations saved to analysis/charts/:
   - complaints_by_category.png
   - complaints_by_priority.png
   - complaints_by_department.png
   - complaints_by_location.png
   - urgency_score_distribution.png (if urgency scores are present)

Design:
- Completely independent of Supabase credentials and backend servers.
- Tolerant of missing optional fields (e.g. user_id, created_at, urgency_score).
- Uses transparent group-by and counting methods (no black-box ML).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless / CI environments
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

try:
    from analysis.urgency_score import (
        calculate_urgency_score,
        get_urgency_level,
    )
except ModuleNotFoundError:
    # Handle direct script execution where analysis is not in sys.path
    REPO_ROOT = Path(__file__).resolve().parent.parent
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))
    try:
        from analysis.urgency_score import (
            calculate_urgency_score,
            get_urgency_level,
        )
    except ModuleNotFoundError:
        from urgency_score import (
            calculate_urgency_score,
            get_urgency_level,
        )

# Standard schema definition
EXPECTED_COLUMNS = [
    "id",
    "description",
    "location",
    "category",
    "priority",
    "department",
    "status",
    "user_id",
    "created_at",
    "urgency_score",
]

# Core columns required for baseline analysis
CORE_COLUMNS = ["location", "category"]

# Baseline standard schema required for compliant grievance data
REQUIRED_COLUMNS = [
    "id",
    "description",
    "location",
    "category",
    "priority",
    "department",
    "status",
]

# Civic categories and departments (matching YG's module and system specification)
VALID_CATEGORIES = (
    "Road / Infrastructure",
    "Garbage / Waste",
    "Water",
    "Electricity / Streetlight",
    "Crime / Safety",
    "Other",
)

VALID_PRIORITIES = ("High", "Medium", "Low")

VALID_DEPARTMENTS = (
    "Public Works Department",
    "Municipality",
    "Water Department",
    "Electricity Department",
    "Police",
    "General Department",
)

DEFAULT_CSV_PATH = Path(__file__).resolve().parent / "sample_complaints.csv"
DEFAULT_CHARTS_DIR = Path(__file__).resolve().parent / "charts"


# ============================================================================
# 1. DATA LOADING & VALIDATION
# ============================================================================

def load_complaints(
    filepath: Optional[Union[str, Path]] = None,
    required_columns: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Load and validate complaint data from a CSV file.

    Gracefully handles optional fields (e.g., urgencyScore, user_id, created_at).
    Normalizes column aliases (e.g. 'urgencyScore' to 'urgency_score').

    Args:
        filepath: Path to the CSV file. Defaults to sample_complaints.csv.
        required_columns: List of columns strictly required. Defaults to None (flexible).

    Returns:
        pd.DataFrame: Cleaned complaints DataFrame.

    Raises:
        FileNotFoundError: If the specified file does not exist.
        ValueError: If file is empty or missing specified required columns.
    """
    target_path = Path(filepath) if filepath is not None else DEFAULT_CSV_PATH

    if not target_path.exists():
        raise FileNotFoundError(f"Complaint data file not found at: {target_path}")

    df = pd.read_csv(target_path)

    if df.empty:
        raise ValueError(f"Complaint data file is empty: {target_path}")

    # Normalize column names (support camelCase aliases)
    rename_map = {}
    if "urgencyScore" in df.columns and "urgency_score" not in df.columns:
        rename_map["urgencyScore"] = "urgency_score"
    if "userId" in df.columns and "user_id" not in df.columns:
        rename_map["userId"] = "user_id"
    if "createdAt" in df.columns and "created_at" not in df.columns:
        rename_map["createdAt"] = "created_at"
    if rename_map:
        df = df.rename(columns=rename_map)

    # Validate required columns (defaults to REQUIRED_COLUMNS unless explicitly overridden)
    cols_to_check = required_columns if required_columns is not None else REQUIRED_COLUMNS
    if cols_to_check:
        missing = [col for col in cols_to_check if col not in df.columns]
        if missing:
            raise ValueError(f"CSV file is missing required columns: {missing}")

    # Clean whitespace on string columns
    for col in df.select_dtypes(include=["object", "string"]).columns:
        df[col] = df[col].astype(str).str.strip()

    # Convert urgency_score to numeric if present
    if "urgency_score" in df.columns:
        df["urgency_score"] = pd.to_numeric(df["urgency_score"], errors="coerce")

    return df


# ============================================================================
# 2. DESCRIPTIVE AGGREGATIONS
# ============================================================================

def get_total_complaints(df: pd.DataFrame) -> int:
    """Return the total number of complaints."""
    return int(len(df)) if df is not None else 0


def count_by_category(df: pd.DataFrame) -> pd.Series:
    """Return complaint counts grouped by category, sorted descending."""
    if df is None or df.empty or "category" not in df.columns:
        return pd.Series(dtype=int)
    return df["category"].value_counts()


def count_by_priority(df: pd.DataFrame) -> pd.Series:
    """Return complaint counts grouped by priority.

    Ordered logically: High, Medium, Low (with any other labels appended).
    """
    if df is None or df.empty or "priority" not in df.columns:
        return pd.Series(dtype=int)

    counts = df["priority"].value_counts()
    order = [p for p in VALID_PRIORITIES if p in counts.index]
    remainder = [p for p in counts.index if p not in order]
    return counts.reindex(order + remainder)


def count_by_department(df: pd.DataFrame) -> pd.Series:
    """Return complaint counts grouped by department, sorted descending."""
    if df is None or df.empty or "department" not in df.columns:
        return pd.Series(dtype=int)
    return df["department"].value_counts()


def count_by_status(df: pd.DataFrame) -> pd.Series:
    """Return complaint counts grouped by status, sorted descending."""
    if df is None or df.empty or "status" not in df.columns:
        return pd.Series(dtype=int)
    return df["status"].value_counts()


def count_by_location(df: pd.DataFrame) -> pd.Series:
    """Return complaint counts grouped by location, sorted descending."""
    if df is None or df.empty or "location" not in df.columns:
        return pd.Series(dtype=int)
    return df["location"].value_counts()


def get_average_urgency_score(df: pd.DataFrame) -> Optional[float]:
    """Calculate the average urgency score if urgency scores are available.

    Args:
        df: DataFrame containing complaints.

    Returns:
        Optional[float]: Mean urgency score rounded to 2 decimal places, or None.
    """
    col = None
    if "urgency_score" in df.columns:
        col = "urgency_score"
    elif "urgencyScore" in df.columns:
        col = "urgencyScore"

    if col is None or df.empty:
        return None

    numeric_scores = pd.to_numeric(df[col], errors="coerce").dropna()
    if numeric_scores.empty:
        return None

    return round(float(numeric_scores.mean()), 2)


def count_high_critical_complaints(df: pd.DataFrame) -> Dict[str, int]:
    """Count complaints flagged as High or Critical across priority and urgency metrics.

    Args:
        df: Complaints DataFrame.

    Returns:
        Dict[str, int]: Counts for high priority, critical priority,
                        high urgency (60-79), critical urgency (>=80),
                        and total high-or-critical incidents.
    """
    if df is None or df.empty:
        return {
            "high_priority_count": 0,
            "critical_priority_count": 0,
            "high_urgency_count": 0,
            "critical_urgency_count": 0,
            "total_high_or_critical": 0,
        }

    high_pri = 0
    crit_pri = 0
    if "priority" in df.columns:
        high_pri = int((df["priority"].astype(str).str.strip().str.lower() == "high").sum())
        crit_pri = int((df["priority"].astype(str).str.strip().str.lower() == "critical").sum())

    high_urg = 0
    crit_urg = 0
    urg_col = "urgency_score" if "urgency_score" in df.columns else ("urgencyScore" if "urgencyScore" in df.columns else None)
    if urg_col:
        scores = pd.to_numeric(df[urg_col], errors="coerce")
        crit_urg = int((scores >= 80).sum())
        high_urg = int(((scores >= 60) & (scores < 80)).sum())

    # Total unique complaints meeting high or critical threshold
    mask_severe = pd.Series(False, index=df.index)
    if "priority" in df.columns:
        mask_severe |= df["priority"].astype(str).str.strip().str.lower().isin(["high", "critical"])
    if urg_col:
        mask_severe |= (pd.to_numeric(df[urg_col], errors="coerce") >= 60)

    total_severe = int(mask_severe.sum())

    return {
        "high_priority_count": high_pri,
        "critical_priority_count": crit_pri,
        "high_urgency_count": high_urg,
        "critical_urgency_count": crit_urg,
        "total_high_or_critical": total_severe,
    }


def count_repeated_complaints(df: pd.DataFrame, min_count: int = 2) -> int:
    """Return the total number of complaints that belong to repeated issue clusters."""
    if df is None or df.empty or "location" not in df.columns:
        return 0

    group_cols = ["location"]
    if "category" in df.columns:
        group_cols.append("category")

    counts = df.groupby(group_cols).size()
    repeated_groups = counts[counts >= min_count]
    return int(repeated_groups.sum())


# ============================================================================
# 3. PATTERN DETECTION (EXPLAINABLE & DETERMINISTIC)
# ============================================================================

def get_top_category(df: pd.DataFrame) -> Optional[str]:
    """Return the most frequently reported category, or None if unavailable."""
    counts = count_by_category(df)
    return str(counts.index[0]) if not counts.empty else None


def get_top_priority(df: pd.DataFrame) -> Optional[str]:
    """Return the most common priority level, or None if unavailable."""
    if df is None or df.empty or "priority" not in df.columns:
        return None
    counts = df["priority"].value_counts()
    return str(counts.index[0]) if not counts.empty else None


def get_top_department(df: pd.DataFrame) -> Optional[str]:
    """Return the department receiving the most complaints, or None if unavailable."""
    counts = count_by_department(df)
    return str(counts.index[0]) if not counts.empty else None


def get_top_locations(df: pd.DataFrame, n: int = 5) -> pd.Series:
    """Return the top n locations with the highest number of complaints."""
    counts = count_by_location(df)
    return counts.head(n)


def find_repeated_complaints(df: pd.DataFrame, min_count: int = 2) -> pd.DataFrame:
    """Identify repeated complaints from the same location within the same category.

    Args:
        df: Complaints DataFrame.
        min_count: Minimum complaints in the cluster to qualify as repeated (default: 2).

    Returns:
        pd.DataFrame: Grouped summary with location, category, count, complaint IDs.
    """
    if df is None or df.empty or "location" not in df.columns:
        return pd.DataFrame(
            columns=["location", "category", "complaint_count", "complaint_ids", "sample_descriptions"]
        )

    has_cat = "category" in df.columns
    group_cols = ["location", "category"] if has_cat else ["location"]

    id_col = "id" if "id" in df.columns else df.columns[0]
    desc_col = "description" if "description" in df.columns else None

    agg_kwargs = {
        "complaint_count": (id_col, "count"),
        "complaint_ids": (id_col, lambda ids: list(ids)),
    }
    if desc_col:
        agg_kwargs["sample_descriptions"] = (desc_col, lambda d: list(d)[:3])

    grouped = df.groupby(group_cols).agg(**agg_kwargs).reset_index()

    repeated = grouped[grouped["complaint_count"] >= min_count].sort_values(
        by="complaint_count", ascending=False
    )
    return repeated.reset_index(drop=True)


def find_hotspots(df: pd.DataFrame, threshold: int = 3) -> pd.DataFrame:
    """Identify geographic / locality hotspots based on complaint counts.

    A hotspot is a location where complaint volume meets or exceeds the threshold.

    Args:
        df: Complaints DataFrame.
        threshold: Minimum complaints to qualify as a hotspot (default: 3).

    Returns:
        pd.DataFrame: Locations meeting threshold with counts, percentages, and metrics.
    """
    if df is None or df.empty or "location" not in df.columns:
        return pd.DataFrame(
            columns=["location", "complaint_count", "percentage_of_total", "top_category", "high_priority_count"]
        )

    total = len(df)
    results = []

    for loc, group in df.groupby("location"):
        count = len(group)
        if count >= threshold:
            top_cat = group["category"].mode().iloc[0] if "category" in group.columns and not group["category"].empty else "N/A"
            high_pri = int((group["priority"].astype(str).str.lower() == "high").sum()) if "priority" in group.columns else 0
            pct = round((count / total) * 100, 1) if total > 0 else 0.0

            row_data = {
                "location": loc,
                "complaint_count": count,
                "percentage_of_total": pct,
                "top_category": top_cat,
                "high_priority_count": high_pri,
            }
            if "urgency_score" in group.columns:
                row_data["avg_urgency_score"] = round(float(group["urgency_score"].mean()), 1)

            results.append(row_data)

    if not results:
        return pd.DataFrame(
            columns=["location", "complaint_count", "percentage_of_total", "top_category", "high_priority_count"]
        )

    hotspots_df = pd.DataFrame(results).sort_values(by="complaint_count", ascending=False)
    return hotspots_df.reset_index(drop=True)


def find_priority_concentration(
    df: pd.DataFrame,
    priority: str = "High",
    threshold: int = 2,
) -> pd.DataFrame:
    """Identify locations containing multiple High-priority complaints.

    Args:
        df: Complaints DataFrame.
        priority: Priority filter (default 'High').
        threshold: Minimum high-priority complaints (default: 2).

    Returns:
        pd.DataFrame: Locations with high-priority concentration.
    """
    if df is None or df.empty or "location" not in df.columns or "priority" not in df.columns:
        return pd.DataFrame(columns=["location", "priority_count", "categories", "complaint_ids"])

    filtered = df[df["priority"].astype(str).str.lower() == priority.lower()]
    if filtered.empty:
        return pd.DataFrame(columns=["location", "priority_count", "categories", "complaint_ids"])

    id_col = "id" if "id" in filtered.columns else filtered.columns[0]
    cat_col = "category" if "category" in filtered.columns else None

    agg_kwargs = {
        "priority_count": (id_col, "count"),
        "complaint_ids": (id_col, lambda ids: list(ids)),
    }
    if cat_col:
        agg_kwargs["categories"] = (cat_col, lambda c: list(sorted(set(c))))

    grouped = filtered.groupby("location").agg(**agg_kwargs).reset_index()

    concentration = grouped[grouped["priority_count"] >= threshold].sort_values(
        by="priority_count", ascending=False
    )
    return concentration.reset_index(drop=True)


def find_unusually_frequent_categories(
    df: pd.DataFrame,
    threshold_factor: float = 1.3,
) -> pd.DataFrame:
    """Identify categories with unusually high complaint frequency compared to the average.

    Args:
        df: Complaints DataFrame.
        threshold_factor: Multiplier over mean category volume (default 1.3).

    Returns:
        pd.DataFrame: Unusually frequent categories with count, mean baseline, and ratio.
    """
    cat_counts = count_by_category(df)
    if cat_counts.empty:
        return pd.DataFrame(columns=["category", "count", "mean_baseline", "frequency_ratio"])

    mean_count = float(cat_counts.mean())
    flagged = []

    for cat, count in cat_counts.items():
        if count >= (mean_count * threshold_factor):
            ratio = round(count / mean_count, 2) if mean_count > 0 else 1.0
            flagged.append({
                "category": cat,
                "count": int(count),
                "mean_baseline": round(mean_count, 1),
                "frequency_ratio": ratio,
            })

    return pd.DataFrame(flagged)


def find_recurring_patterns(df: pd.DataFrame, min_count: int = 2) -> pd.DataFrame:
    """Identify recurring patterns where similar issues repeatedly occur at the same location.

    Synthesizes repeated issue clusters with urgency metrics to provide actionable insights.
    """
    repeated = find_repeated_complaints(df, min_count=min_count)
    if repeated.empty:
        return repeated

    # Enrich with average urgency score if available
    if "urgency_score" in df.columns:
        avg_urgencies = []
        for _, row in repeated.iterrows():
            loc = row["location"]
            cat = row.get("category")
            if cat:
                subset = df[(df["location"] == loc) & (df["category"] == cat)]
            else:
                subset = df[df["location"] == loc]
            scores = subset["urgency_score"].dropna()
            avg_urg = round(float(scores.mean()), 1) if not scores.empty else None
            avg_urgencies.append(avg_urg)
        repeated["avg_urgency_score"] = avg_urgencies

    return repeated


# ============================================================================
# 4. EXECUTIVE SUMMARY STATISTICS
# ============================================================================

def get_summary_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate a complete executive overview dictionary of the grievance dataset.

    Returns:
        Dict[str, Any]: Comprehensive metrics covering volume, breakdowns,
                        top drivers, hotspots, and urgency data.
    """
    if df is None or df.empty:
        return {
            "total_complaints": 0,
            "category_counts": {},
            "priority_counts": {},
            "department_counts": {},
            "status_counts": {},
            "top_category": None,
            "top_priority": None,
            "top_department": None,
            "top_location": None,
            "average_urgency_score": None,
            "high_priority_count": 0,
            "high_priority_percentage": 0.0,
            "high_critical_complaints": {
                "high_priority_count": 0,
                "critical_priority_count": 0,
                "high_urgency_count": 0,
                "critical_urgency_count": 0,
                "total_high_or_critical": 0,
            },
            "repeated_complaint_count": 0,
            "hotspot_locations": [],
            "repeated_complaint_groups": 0,
        }

    total = get_total_complaints(df)
    cat_counts = count_by_category(df)
    pri_counts = count_by_priority(df)
    dep_counts = count_by_department(df)
    stat_counts = count_by_status(df)
    loc_counts = count_by_location(df)

    avg_urg = get_average_urgency_score(df)
    severe_info = count_high_critical_complaints(df)
    high_pri_count = severe_info["high_priority_count"]
    high_pri_pct = round((high_pri_count / total * 100), 1) if total > 0 else 0.0
    repeated = find_repeated_complaints(df, min_count=2)
    hotspots = find_hotspots(df, threshold=3)

    return {
        "total_complaints": total,
        "category_counts": cat_counts.to_dict(),
        "priority_counts": pri_counts.to_dict(),
        "department_counts": dep_counts.to_dict(),
        "status_counts": stat_counts.to_dict(),
        "top_category": get_top_category(df),
        "top_priority": get_top_priority(df),
        "top_department": get_top_department(df),
        "top_location": str(loc_counts.index[0]) if not loc_counts.empty else None,
        "average_urgency_score": avg_urg,
        "high_priority_count": high_pri_count,
        "high_priority_percentage": high_pri_pct,
        "high_critical_complaints": severe_info,
        "repeated_complaint_count": count_repeated_complaints(df, min_count=2),
        "hotspot_locations": hotspots["location"].tolist() if not hotspots.empty else [],
        "repeated_complaint_groups": int(len(repeated)),
    }


# ============================================================================
# 5. CHART VISUALIZATION (MATPLOTLIB)
# ============================================================================

def generate_charts(
    df: pd.DataFrame,
    output_dir: Optional[Union[str, Path]] = None,
) -> List[Path]:
    """Generate and save presentation-quality civic analysis charts using Matplotlib.

    Generates up to 5 charts:
    1. complaints_by_category.png: Horizontal bar chart of volume per category.
    2. complaints_by_priority.png: Severity breakdown (High/Medium/Low).
    3. complaints_by_department.png: Workload volume per municipal department.
    4. complaints_by_location.png: Location distribution showing civic hotspots.
    5. urgency_score_distribution.png: Distribution / histogram of urgency scores (if available).

    Args:
        df: Complaints DataFrame.
        output_dir: Target directory for PNG charts. Defaults to analysis/charts/.

    Returns:
        List[Path]: Paths to the generated image files.
    """
    out_path = Path(output_dir) if output_dir is not None else DEFAULT_CHARTS_DIR
    out_path.mkdir(parents=True, exist_ok=True)

    generated_files: List[Path] = []

    cat_color = "#2563EB"       # Civic Blue
    pri_colors = {
        "Critical": "#991B1B",  # Deep Crimson
        "High": "#DC2626",      # Crimson
        "Medium": "#F59E0B",    # Amber
        "Moderate": "#F59E0B",
        "Low": "#10B981",       # Emerald
    }
    dept_color = "#0D9488"      # Teal
    loc_color = "#4F46E5"       # Indigo

    # ------------------------------------------------------------------------
    # Chart 1: Complaints by Category
    # ------------------------------------------------------------------------
    if "category" in df.columns and not df["category"].dropna().empty:
        cat_counts = count_by_category(df).sort_values(ascending=True)
        fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
        bars = ax.barh(cat_counts.index, cat_counts.values, color=cat_color, edgecolor="#1E40AF", height=0.6)
        ax.set_title("Citizen Complaints by Category", fontsize=14, fontweight="bold", pad=12)
        ax.set_xlabel("Number of Complaints", fontsize=11, labelpad=8)
        ax.grid(axis="x", linestyle="--", alpha=0.5)

        for bar in bars:
            width = bar.get_width()
            ax.text(
                width + 0.15,
                bar.get_y() + bar.get_height() / 2,
                f"{int(width)}",
                ha="left",
                va="center",
                fontsize=10,
                fontweight="semibold",
            )

        ax.set_xlim(0, max(cat_counts.values) + 1.5 if len(cat_counts) > 0 else 5)
        plt.tight_layout()
        chart1_file = out_path / "complaints_by_category.png"
        plt.savefig(chart1_file, dpi=150)
        plt.close(fig)
        generated_files.append(chart1_file)

    # ------------------------------------------------------------------------
    # Chart 2: Complaints by Priority
    # ------------------------------------------------------------------------
    if "priority" in df.columns and not df["priority"].dropna().empty:
        pri_counts = count_by_priority(df)
        colors = [pri_colors.get(p, "#6B7280") for p in pri_counts.index]

        fig, ax = plt.subplots(figsize=(7, 4.5), dpi=150)
        bars = ax.bar(pri_counts.index, pri_counts.values, color=colors, edgecolor="#1F2937", width=0.55)
        ax.set_title("Complaint Breakdown by Priority Level", fontsize=14, fontweight="bold", pad=12)
        ax.set_ylabel("Number of Complaints", fontsize=11, labelpad=8)
        ax.set_xlabel("Priority Level", fontsize=11, labelpad=8)
        ax.grid(axis="y", linestyle="--", alpha=0.5)

        total_pts = len(df)
        for bar in bars:
            height = bar.get_height()
            pct = (height / total_pts * 100) if total_pts > 0 else 0
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                height + 0.25,
                f"{int(height)} ({pct:.0f}%)",
                ha="center",
                va="bottom",
                fontsize=10,
                fontweight="semibold",
            )

        ax.set_ylim(0, max(pri_counts.values) + 2.5 if len(pri_counts) > 0 else 5)
        plt.tight_layout()
        chart2_file = out_path / "complaints_by_priority.png"
        plt.savefig(chart2_file, dpi=150)
        plt.close(fig)
        generated_files.append(chart2_file)

    # ------------------------------------------------------------------------
    # Chart 3: Complaints by Department
    # ------------------------------------------------------------------------
    if "department" in df.columns and not df["department"].dropna().empty:
        dept_counts = count_by_department(df).sort_values(ascending=True)
        fig, ax = plt.subplots(figsize=(8.5, 4.5), dpi=150)
        bars = ax.barh(dept_counts.index, dept_counts.values, color=dept_color, edgecolor="#115E59", height=0.6)
        ax.set_title("Complaint Load by Responsible Department", fontsize=14, fontweight="bold", pad=12)
        ax.set_xlabel("Number of Assigned Complaints", fontsize=11, labelpad=8)
        ax.grid(axis="x", linestyle="--", alpha=0.5)

        for bar in bars:
            width = bar.get_width()
            ax.text(
                width + 0.15,
                bar.get_y() + bar.get_height() / 2,
                f"{int(width)}",
                ha="left",
                va="center",
                fontsize=10,
                fontweight="semibold",
            )

        ax.set_xlim(0, max(dept_counts.values) + 1.5 if len(dept_counts) > 0 else 5)
        plt.tight_layout()
        chart3_file = out_path / "complaints_by_department.png"
        plt.savefig(chart3_file, dpi=150)
        plt.close(fig)
        generated_files.append(chart3_file)

    # ------------------------------------------------------------------------
    # Chart 4: Complaints by Location (Spotlighting Hotspots)
    # ------------------------------------------------------------------------
    if "location" in df.columns and not df["location"].dropna().empty:
        loc_counts = count_by_location(df).sort_values(ascending=True)
        bar_colors = ["#EF4444" if v >= 3 else loc_color for v in loc_counts.values]

        fig, ax = plt.subplots(figsize=(9, 5.5), dpi=150)
        bars = ax.barh(loc_counts.index, loc_counts.values, color=bar_colors, edgecolor="#312E81", height=0.6)
        ax.set_title("Complaint Distribution by Location (Hotspots in Red)", fontsize=14, fontweight="bold", pad=12)
        ax.set_xlabel("Number of Complaints", fontsize=11, labelpad=8)
        ax.grid(axis="x", linestyle="--", alpha=0.5)

        ax.axvline(x=3, color="#DC2626", linestyle=":", linewidth=1.5, label="Hotspot Threshold (>=3)")
        ax.legend(loc="lower right", framealpha=0.9)

        for bar in bars:
            width = bar.get_width()
            ax.text(
                width + 0.12,
                bar.get_y() + bar.get_height() / 2,
                f"{int(width)}",
                ha="left",
                va="center",
                fontsize=9.5,
                fontweight="semibold",
            )

        ax.set_xlim(0, max(loc_counts.values) + 1.2 if len(loc_counts) > 0 else 5)
        plt.tight_layout()
        chart4_file = out_path / "complaints_by_location.png"
        plt.savefig(chart4_file, dpi=150)
        plt.close(fig)
        generated_files.append(chart4_file)

    # ------------------------------------------------------------------------
    # Chart 5: Urgency Score Distribution (if available)
    # ------------------------------------------------------------------------
    urg_col = "urgency_score" if "urgency_score" in df.columns else ("urgencyScore" if "urgencyScore" in df.columns else None)
    if urg_col and not df[urg_col].dropna().empty:
        scores = pd.to_numeric(df[urg_col], errors="coerce").dropna()
        if not scores.empty:
            fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
            bins = [0, 40, 60, 80, 100]
            labels = ["Low (0-39)", "Moderate (40-59)", "High (60-79)", "Critical (80-100)"]
            band_colors = ["#10B981", "#F59E0B", "#EA580C", "#DC2626"]

            counts, _ = np.histogram(scores, bins=bins)
            bars = ax.bar(labels, counts, color=band_colors, edgecolor="#1F2937", width=0.55)
            ax.set_title("Grievance Urgency Score Level Distribution", fontsize=14, fontweight="bold", pad=12)
            ax.set_ylabel("Number of Complaints", fontsize=11, labelpad=8)
            ax.set_xlabel("Urgency Band", fontsize=11, labelpad=8)
            ax.grid(axis="y", linestyle="--", alpha=0.5)

            for bar in bars:
                height = bar.get_height()
                ax.text(
                    bar.get_x() + bar.get_width() / 2,
                    height + 0.2,
                    f"{int(height)}",
                    ha="center",
                    va="bottom",
                    fontsize=10,
                    fontweight="semibold",
                )

            ax.set_ylim(0, max(counts) + 2.5 if len(counts) > 0 else 5)
            plt.tight_layout()
            chart5_file = out_path / "urgency_score_distribution.png"
            plt.savefig(chart5_file, dpi=150)
            plt.close(fig)
            generated_files.append(chart5_file)

    return generated_files


# ============================================================================
# 6. TERMINAL REPORT PRINTER
# ============================================================================

def print_analysis_report(df: pd.DataFrame) -> None:
    """Format and print an executive terminal report of grievance patterns."""
    summary = get_summary_statistics(df)
    hotspots = find_hotspots(df, threshold=3)
    repeated = find_repeated_complaints(df, min_count=2)
    high_pri_clusters = find_priority_concentration(df, priority="High", threshold=2)
    frequent_cats = find_unusually_frequent_categories(df, threshold_factor=1.3)

    border = "=" * 70
    sub_border = "-" * 70

    print("\n" + border)
    print(" CITIZEN GRIEVANCE PORTAL - DATA SCIENCE & PATTERN DETECTION REPORT")
    print(" Owner: YM (Data Analysis + Pattern Detection + Testing)")
    print(border)

    print("\n[1] EXECUTIVE SUMMARY:")
    print(f"  * Total Grievances Analyzed : {summary['total_complaints']}")
    print(f"  * Top Complaint Category     : {summary['top_category']}")
    print(f"  * Most Common Priority Level : {summary['top_priority']}")
    print(f"  * Highest Load Department   : {summary['top_department']}")
    print(f"  * Peak Grievance Location    : {summary['top_location']}")
    if summary['average_urgency_score'] is not None:
        print(f"  * Average Urgency Score      : {summary['average_urgency_score']} / 100")
    print(f"  * High/Critical Emergencies  : {summary['high_critical_complaints']['total_high_or_critical']}")
    print(f"  * Hotspot Locations Found    : {len(summary['hotspot_locations'])}")
    print(f"  * Repeated Issue Clusters    : {summary['repeated_complaint_groups']}")
    print(f"  * Repeated Complaints Volume : {summary['repeated_complaint_count']}")

    print("\n[2] COMPLAINTS BY CATEGORY:")
    for cat, count in summary["category_counts"].items():
        print(f"  - {cat:<26}: {count:>2} complaints")

    print("\n[3] COMPLAINTS BY PRIORITY:")
    for pri, count in summary["priority_counts"].items():
        pct = (count / summary['total_complaints'] * 100) if summary['total_complaints'] > 0 else 0
        print(f"  - {pri:<10}: {count:>2} complaints ({pct:>4.1f}%)")

    print("\n[4] COMPLAINTS BY DEPARTMENT:")
    for dep, count in summary["department_counts"].items():
        print(f"  - {dep:<26}: {count:>2} complaints")

    print("\n[5] COMPLAINTS BY STATUS:")
    for stat, count in summary["status_counts"].items():
        print(f"  - {stat:<18}: {count:>2} complaints")

    print("\n[6] CIVIC HOTSPOTS (Locations with >= 3 complaints):")
    if hotspots.empty:
        print("  None detected.")
    else:
        for _, row in hotspots.iterrows():
            urg_str = f" | Avg Urgency: {row['avg_urgency_score']}" if "avg_urgency_score" in row else ""
            print(
                f"  * {row['location']:<26} | Total: {row['complaint_count']:>2} | "
                f"Share: {row['percentage_of_total']:>4.1f}% | Dominant: {row['top_category']}"
                f"{urg_str}"
            )

    print("\n[7] REPEATED / RECURRING COMPLAINT CLUSTERS (Same Location & Category):")
    if repeated.empty:
        print("  None detected.")
    else:
        for _, row in repeated.iterrows():
            ids_str = ", ".join(row["complaint_ids"])
            cat_str = f" [{row['category']}]" if "category" in row else ""
            print(
                f"  [REPEAT] {row['location']}{cat_str} -> {row['complaint_count']} reports "
                f"(IDs: {ids_str})"
            )

    print("\n[8] HIGH-PRIORITY CONCENTRATION (Locations with >= 2 High-Priority Emergencies):")
    if high_pri_clusters.empty:
        print("  None detected.")
    else:
        for _, row in high_pri_clusters.iterrows():
            cats = ", ".join(row.get("categories", ["N/A"]))
            ids_str = ", ".join(row["complaint_ids"])
            print(
                f"  [HIGH-ALERT] {row['location']}: {row['priority_count']} High-Priority incidents "
                f"| Domains: {cats} | IDs: {ids_str}"
            )

    if not frequent_cats.empty:
        print("\n[9] UNUSUALLY FREQUENT CATEGORIES (Exceeding volume baseline):")
        for _, row in frequent_cats.iterrows():
            print(f"  ! {row['category']}: {row['count']} complaints ({row['frequency_ratio']}x higher than baseline {row['mean_baseline']})")

    print(sub_border)


# ============================================================================
# 7. MAIN ENTRYPOINT
# ============================================================================

def main() -> None:
    """Run full analysis pipeline on complaints and generate visual charts."""
    csv_file = sys.argv[1] if len(sys.argv) > 1 else None
    target_name = Path(csv_file).name if csv_file else DEFAULT_CSV_PATH.name
    print(f"Loading complaint dataset ({target_name})...")
    df = load_complaints(csv_file)
    print_analysis_report(df)

    print("\nGenerating visual charts...")
    charts = generate_charts(df)
    for chart in charts:
        print(f"  [SAVED] {chart}")
    print(f"\nAnalysis and {len(charts)} chart(s) generated successfully.\n")


if __name__ == "__main__":
    main()
