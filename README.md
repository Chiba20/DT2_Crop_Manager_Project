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


## What the project does

DT2 Crop Manager helps farming teams keep all their crop information in one place and surface insights that guide planting, harvesting, and inventory decisions.

### Core features

- **Crop records** – Add crops with name, variety, planting date, and expected harvest windows.
- **Harvest tracking** – Log harvest events (date, quantity, and notes) to understand performance over time.
- **Yield forecasting** – Use stored crop and harvest data to generate yield predictions.
- **Dashboard views** – Visualize production trends and compare harvests across seasons.
- **User authentication** – Secure access to API endpoints with user accounts and tokens.

### How it works (architecture)

- **Frontend**: A React single-page app that calls the backend via Axios. Routing is handled by React Router and charts are rendered with Recharts.
- **Backend**: A Flask API that exposes blueprinted routes for auth, crops, harvests, and predictions. Responses are JSON so the frontend can render data dynamically.
- **Data**: Crop and harvest records are stored in the backend datastore; prediction endpoints derive insights from these records.
- **Deployment**: Docker images for the frontend and backend are orchestrated with Docker Compose for local dev and deployed together to the production Render instance.

### Key API routes

- `POST /auth/register` / `POST /auth/login` – Create or authenticate a user and receive a token.
- `GET /crops` / `POST /crops` – List crops or add a new crop record.
- `GET /crops/<id>` / `PUT /crops/<id>` / `DELETE /crops/<id>` – Retrieve, update, or delete a specific crop.
- `GET /harvests` / `POST /harvests` – View or log harvest events.
- `GET /predictions` – Fetch yield predictions based on existing data.

### Why it matters

- Centralizes crop history so teams can avoid siloed spreadsheets.
- Tracks harvest performance against expectations to surface underperforming fields.
- Provides quick forecasts that support planning for sales, storage, and logistics.
