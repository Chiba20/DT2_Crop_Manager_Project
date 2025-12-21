# DT2 Crop Manager

A full-stack crop management platform that lets farmers track crop records, monitor harvests, and run yield predictions. The project is split into a Flask API backend and a React SPA frontend that communicates via REST endpoints.

## Live demo

- **Production site:** https://dt2-crop-manager-project.onrender.com

## Tech stack

- **Frontend:** React, React Router, Recharts, Axios
- **Backend:** Flask with blueprints for auth, crop, harvest, and prediction routes
- **Containerization:** Docker + Docker Compose for local orchestration

## Project structure

- `backend/` – Flask application entrypoint (`app.py`), blueprints under `crop_tracker/`, and Python dependencies in `requirements.txt`.
- `frontend/cropmanager-frontend/` – React application (Create React App) with pages, components, and API helpers under `src/`.
- `docker-compose.yml` – Spins up both services for local development with sensible defaults.

## Local development

### Prerequisites

- Python 3.10+ with `pip`
- Node.js 18+ with `npm`
- Docker (optional, for containerized setup)

### Option 1: Run with Docker Compose

1. Build and start both services:
   ```bash
   docker-compose up --build
   ```
2. Frontend: http://localhost:3000
3. Backend API: http://localhost:8000

### Option 2: Run services manually

**Backend (Flask)**
1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Start the API server (defaults to port 8000):
   ```bash
   python app.py
   ```

**Frontend (React)**
1. Install dependencies:
   ```bash
   cd frontend/cropmanager-frontend
   npm install
   ```
2. Point the frontend at your API (optional if using the default `http://localhost:8000`):
   ```bash
   export REACT_APP_API_BASE=http://localhost:8000
   ```
3. Start the dev server (defaults to port 3000):
   ```bash
   npm start
   ```

## Environment variables

- `REACT_APP_API_BASE` – Frontend base URL for the API. Defaults to `http://localhost:8000` for local dev and is overridden in `docker-compose.yml` for containerized runs.
- `SECRET_KEY` – Flask secret key; defaults to `MYSECRET_KEY` if not provided.

## Testing

- Frontend: `npm test` from `frontend/cropmanager-frontend`
- Backend: add your preferred test runner (e.g., `pytest`) and point it at `backend/`
