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
