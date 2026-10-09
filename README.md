# Citizen Grievance Portal

A frontend implementation of a civic service portal for citizens to report, track, and resolve local issues.

## Project Purpose
This project provides a clean, user-friendly interface for citizens to:
* Create an account and sign in
* Report local grievances (e.g., broken streetlights, potholes)
* Track the status of submitted grievances
* View their complete history of reported issues

The design focuses on accessibility, trustworthiness, and clarity, avoiding exaggerated visual styles in favor of a clean, civic-focused identity.

## Technology Used
* **React** - UI Library
* **Vite** - Build tool and development server
* **Tailwind CSS** - Styling and layout
* **React Router** - Client-side navigation
* **Lucide React** - Iconography

## Project Structure
* `/src/components` - Reusable UI components (Layout, etc.)
* `/src/pages` - Main application screens
* `/src/data` - Mock data representing backend responses
* `/src/assets` - Static assets

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## Limitations & Future Work
* This is a **frontend-only** implementation using mock data.
* Authentication and form submissions are simulated.
* Future work would involve connecting this frontend to a real backend API (e.g., Node.js/Express, Django) and a database to persist user accounts and grievances.

Contribution note: Website development update by Yashvi.
## Backend Setup & API Documentation

The project includes a FastAPI backend that handles citizen grievance intake, automatic rule-based categorization, priority calculation, department assignment, and persistence to Supabase.

### 1. Create Python Virtual Environment
From the repository root, create a Python virtual environment:
```powershell
python -m venv venv
```

### 2. Activate Virtual Environment on Windows
In PowerShell:
```powershell
.\venv\Scripts\Activate.ps1
```
*(If script execution is disabled in PowerShell, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`, or in Command Prompt run `venv\Scripts\activate.bat`)*

### 3. Install Dependencies
Install all required backend packages:
```powershell
pip install -r backend/requirements.txt
```

### 4. Configure Environment Variables (`backend/.env`)
Create `backend/.env` from the template:
```powershell
copy backend\.env.example backend\.env
```

### 5. Configure Supabase Credentials
Open `backend/.env` and insert your Supabase project credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```
> **Security Note:** Never commit `backend/.env` or expose secret service-role keys. Only use the public/publishable key.

### 6. Start the FastAPI Backend
Run the backend with Uvicorn:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The server will start at `http://127.0.0.1:8000`.

### 7. Interactive Swagger API Documentation
Open your browser and navigate to:
```
http://127.0.0.1:8000/docs
```
You can inspect and execute all API endpoints directly from Swagger UI.

### 8. Testing the Endpoints

#### Health Check
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get
```
Response:
```json
{
  "status": "ok"
}
```

#### Submit a Complaint (`POST /complaints`)
Using PowerShell:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/complaints" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"description": "There is a dangerous pothole near the college", "location": "Kolkata"}'
```

Using `curl`:
```bash
curl -X POST "http://127.0.0.1:8000/complaints" \
  -H "Content-Type: application/json" \
  -d '{"description": "There is a dangerous pothole near the college", "location": "Kolkata"}'
```

Successful Response:
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "complaint": {
    "category": "Road / Infrastructure",
    "priority": "High",
    "department": "Public Works Department",
    "status": "Submitted"
  }
}
```
