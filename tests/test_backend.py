import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from backend.main import app


class TestBackendAPI(unittest.TestCase):
    """Test suite for FastAPI backend endpoints and complaint processing."""

    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        """GET /health must return status ok."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_invalid_complaint_empty_description(self):
        """POST /complaints with empty description must be rejected."""
        response = self.client.post(
            "/complaints",
            json={"description": "", "location": "Kolkata"},
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_complaint_whitespace_description(self):
        """POST /complaints with whitespace-only description must be rejected."""
        response = self.client.post(
            "/complaints",
            json={"description": "   ", "location": "Kolkata"},
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_complaint_missing_location(self):
        """POST /complaints with missing location must be rejected."""
        response = self.client.post(
            "/complaints",
            json={"description": "There is a pothole"},
        )
        self.assertEqual(response.status_code, 422)

    def test_complaint_missing_supabase_env_returns_500(self):
        """When Supabase is unconfigured, return 500 error instead of false success."""
        with patch("backend.routes.complaints.get_supabase_client") as mock_get_client:
            mock_get_client.side_effect = RuntimeError("Supabase credentials not configured.")
            response = self.client.post(
                "/complaints",
                json={
                    "description": "There is a dangerous pothole near the college",
                    "location": "Kolkata",
                },
            )
            self.assertEqual(response.status_code, 500)
            self.assertIn("error", response.json()["detail"].lower())

    def test_complaint_processing_and_mocked_supabase_insert(self):
        """POST /complaints correctly categorizes and constructs payload for Supabase."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()

        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = mock_execute
        mock_execute.data = [
            {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "created_at": "2026-10-04T12:00:00Z",
                "description": "There is a dangerous pothole near the college",
                "location": "Kolkata",
                "category": "Road / Infrastructure",
                "priority": "High",
                "department": "Public Works Department",
                "status": "Submitted",
            }
        ]

        with patch("backend.routes.complaints.get_supabase_client", return_value=mock_supabase):
            response = self.client.post(
                "/complaints",
                json={
                    "description": "There is a dangerous pothole near the college",
                    "location": "Kolkata",
                },
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["message"], "Complaint submitted successfully")
            self.assertEqual(data["complaint"]["category"], "Road / Infrastructure")
            self.assertEqual(data["complaint"]["priority"], "High")
            self.assertEqual(data["complaint"]["department"], "Public Works Department")
            self.assertEqual(data["complaint"]["status"], "Submitted")

            # Check insert payload sent to Supabase
            mock_table.insert.assert_called_once_with(
                {
                    "description": "There is a dangerous pothole near the college",
                    "location": "Kolkata",
                    "category": "Road / Infrastructure",
                    "priority": "High",
                    "department": "Public Works Department",
                    "status": "Submitted",
                }
            )

    def test_additional_complaint_scenarios(self):
        """Test the 4 required scenarios from Task 12."""
        cases = [
            (
                "There is a large pothole on the road",
                "Road / Infrastructure",
                "Medium",
                "Public Works Department",
            ),
            (
                "Garbage has not been collected for several days",
                "Garbage / Waste",
                "Medium",
                "Municipality",
            ),
            (
                "There is no water supply in our area",
                "Water",
                "Medium",
                "Water Department",
            ),
            (
                "There is a dangerous situation and immediate help is needed",
                "Other",
                "High",
                "General Department",
            ),
        ]

        for desc, expected_cat, expected_pri, expected_dept in cases:
            mock_supabase = MagicMock()
            mock_insert = MagicMock()
            mock_execute = MagicMock()
            mock_supabase.table.return_value.insert.return_value = mock_insert
            mock_insert.execute.return_value = mock_execute
            mock_execute.data = [{"id": "abc"}]

            with patch("backend.routes.complaints.get_supabase_client", return_value=mock_supabase):
                response = self.client.post(
                    "/complaints",
                    json={"description": desc, "location": "Test City"},
                )
                self.assertEqual(response.status_code, 200)
                res = response.json()["complaint"]
                self.assertEqual(res["category"], expected_cat)
                self.assertEqual(res["priority"], expected_pri)
                self.assertEqual(res["department"], expected_dept)
                self.assertEqual(res["status"], "Submitted")

    def test_delete_complaint_success(self):
        """DELETE /complaints/{id} by authorized handler succeeds and calls Supabase delete."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq_select = MagicMock()
        mock_exec_select = MagicMock()
        mock_delete = MagicMock()
        mock_eq_delete = MagicMock()
        mock_exec_delete = MagicMock()

        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq_select
        mock_eq_select.execute.return_value = mock_exec_select
        mock_exec_select.data = [{"id": "cmp-12345"}]

        mock_table.delete.return_value = mock_delete
        mock_delete.eq.return_value = mock_eq_delete
        mock_eq_delete.execute.return_value = mock_exec_delete
        mock_exec_delete.data = [{"id": "cmp-12345"}]

        with patch("backend.routes.complaints.get_supabase_client", return_value=mock_supabase):
            response = self.client.delete(
                "/complaints/cmp-12345",
                headers={"x-user-role": "handler"},
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["deleted_id"], "cmp-12345")
            self.assertIn("deleted successfully", data["message"].lower())

    def test_delete_complaint_not_found_returns_404(self):
        """DELETE /complaints/{id} for non-existent record returns 404."""
        mock_supabase = MagicMock()
        mock_table = MagicMock()
        mock_select = MagicMock()
        mock_eq_select = MagicMock()
        mock_exec_select = MagicMock()

        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq_select
        mock_eq_select.execute.return_value = mock_exec_select
        mock_exec_select.data = []  # No record found

        with patch("backend.routes.complaints.get_supabase_client", return_value=mock_supabase):
            response = self.client.delete(
                "/complaints/nonexistent-id",
                headers={"x-user-role": "handler"},
            )
            self.assertEqual(response.status_code, 404)
            self.assertIn("not found", response.json()["detail"].lower())

    def test_delete_complaint_unauthorized_citizen_returns_403(self):
        """DELETE /complaints/{id} by unauthorized citizen role returns 403 Forbidden."""
        response = self.client.delete(
            "/complaints/cmp-12345",
            headers={"x-user-role": "citizen"},
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("unauthorized", response.json()["detail"].lower())

    def test_delete_complaint_database_error_returns_500(self):
        """DELETE /complaints/{id} returns 500 when Supabase client throws an error."""
        with patch("backend.routes.complaints.get_supabase_client") as mock_get_client:
            mock_get_client.side_effect = RuntimeError("Database offline")
            response = self.client.delete(
                "/complaints/cmp-12345",
                headers={"x-user-role": "handler"},
            )
            self.assertEqual(response.status_code, 500)


if __name__ == "__main__":
    unittest.main()

