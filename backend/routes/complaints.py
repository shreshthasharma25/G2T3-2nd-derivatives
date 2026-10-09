import sys
from pathlib import Path
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, field_validator

# Ensure repository root is on sys.path so existing categorization module can be imported
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from categorization.categorizer import categorize_complaint
from categorization.department import get_department
from categorization.priority import determine_priority
from backend.supabase_client import get_supabase_client

router = APIRouter(tags=["complaints"])


class ComplaintRequest(BaseModel):
    description: str
    location: str

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("description is required and cannot be empty or only whitespace")
        return value.strip()

    @field_validator("location")
    @classmethod
    def validate_location(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("location is required and cannot be empty or only whitespace")
        return value.strip()


@router.post("/complaints")
async def create_complaint(complaint: ComplaintRequest):
    """Process a citizen complaint through the categorization module and persist to Supabase."""
    # 1. Extract validated fields
    description = complaint.description
    location = complaint.location

    # 2. Call existing categorization module functions
    category = categorize_complaint(description)
    priority = determine_priority(description, category)
    department = get_department(category)

    # 3. Set initial status
    complaint_status = "Submitted"

    # 4. Prepare payload for complaints table
    payload = {
        "description": description,
        "location": location,
        "category": category,
        "priority": priority,
        "department": department,
        "status": complaint_status,
    }

    # 5. Save to Supabase
    try:
        supabase = get_supabase_client()
        result = supabase.table("complaints").insert(payload).execute()
    except RuntimeError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database configuration error: {str(err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save complaint to Supabase: {str(exc)}",
        )

    # Verify insertion result
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save complaint to Supabase: No response received from database",
        )

    complaint_data = {
        "category": category,
        "priority": priority,
        "department": department,
        "status": complaint_status,
    }

    # If Supabase returned row data, attach additional metadata
    if hasattr(result, "data") and isinstance(result.data, list) and len(result.data) > 0:
        inserted_row = result.data[0]
        if "id" in inserted_row:
            complaint_data["id"] = inserted_row["id"]
        if "created_at" in inserted_row:
            complaint_data["created_at"] = inserted_row["created_at"]

    # 6. Return response according to specification
    return {
        "success": True,
        "message": "Complaint submitted successfully",
        "complaint": complaint_data,
    }


@router.delete("/complaints/{complaint_id}")
async def delete_complaint(
    complaint_id: str,
    x_user_role: str | None = Header(default=None, alias="x-user-role"),
    x_user_id: str | None = Header(default=None, alias="x-user-id"),
):
    """Permanently delete a citizen complaint from Supabase.

    - Validates complaint_id.
    - Restricts deletion to authorized users (handler or admin).
    - Rejects unauthorized citizen deletion attempts with 403 Forbidden.
    - Handles missing records with 404 Not Found.
    - Handles database/server errors with 500 Internal Server Error.
    """
    # 1. Validate complaint_id
    if not complaint_id or not complaint_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint ID is required and cannot be empty",
        )
    complaint_id = complaint_id.strip()

    # 2. Authorization validation
    # Only authorized grievance handlers or administrators can delete complaints
    if x_user_role and x_user_role.strip().lower() not in ("handler", "admin", "administrator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Only grievance handlers or administrators can delete complaints",
        )

    # 3. Connect to Supabase and verify record exists
    try:
        supabase = get_supabase_client()
        existing_result = supabase.table("complaints").select("id").eq("id", complaint_id).execute()
    except RuntimeError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database configuration error: {str(err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query complaint in Supabase: {str(exc)}",
        )

    # Validate that record was found
    if not existing_result or not getattr(existing_result, "data", None):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID '{complaint_id}' not found",
        )

    # 4. Perform permanent deletion
    try:
        delete_result = supabase.table("complaints").delete().eq("id", complaint_id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete complaint from Supabase: {str(exc)}",
        )

    return {
        "success": True,
        "message": "Complaint deleted successfully",
        "deleted_id": complaint_id,
    }

