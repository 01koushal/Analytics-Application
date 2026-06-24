# Simple User Analytics Application

A full-stack analytics assignment that tracks page views and clicks from a browser page, stores events in MongoDB Atlas, and displays session and heatmap analytics in a React dashboard.

## Architecture

- `tracker/tracker.js` runs in the browser, creates a reusable `session_id`, and sends `page_view` and `click` events to Flask.
- `backend/app.py` exposes a JSON API, validates incoming events, stores them in MongoDB, and returns session, journey, and heatmap data.
- `frontend/` is a React + Vite dashboard using Axios and React Router.
- `demo/index.html` is a standalone page for generating test events.

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
```

Run the Flask API:

```bash
python app.py
```

The backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs on the Vite URL printed in the terminal, usually `http://localhost:5173`.

Optional frontend environment variable:

```env
VITE_API_URL=http://localhost:5000/api
```

### Tracker Demo

Open `demo/index.html` in a browser while the Flask backend is running. The page loads `tracker/tracker.js` and sends events to:

```text
http://localhost:5000/api/events
```

To use a different endpoint, define this before loading the script:

```html
<script>
  window.ANALYTICS_API_URL = "http://localhost:5000/api/events";
</script>
```

## API Documentation

### Health Check

`GET /`

Response:

```json
{
  "success": true,
  "message": "Analytics Backend Running"
}
```

### Create Event

`POST /api/events`

Request for page view:

```json
{
  "session_id": "session-id",
  "event_type": "page_view",
  "page_url": "/",
  "timestamp": "2026-06-25T10:30:00.000Z"
}
```

Request for click:

```json
{
  "session_id": "session-id",
  "event_type": "click",
  "page_url": "/",
  "timestamp": "2026-06-25T10:30:00.000Z",
  "x": 100,
  "y": 200
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "mongo-object-id"
  }
}
```

### List Sessions

`GET /api/sessions`

Returns session IDs with event counts and first/last timestamps.

### Session Journey

`GET /api/sessions/<session_id>`

Returns the ordered event timeline for one session.

### Heatmap Data

`GET /api/heatmap?page=/`

Returns click coordinates for the selected page URL.

## MongoDB

Database: `analytics_db`

Collection: `events`

Stored event shape:

```json
{
  "session_id": "session-id",
  "event_type": "page_view",
  "page_url": "/",
  "timestamp": "2026-06-25T10:30:00.000Z",
  "x": 100,
  "y": 200
}
```

Indexes are created on startup:

- `session_id`
- `page_url`
- `timestamp`

## Assumptions

- The tracker records viewport click coordinates using `clientX` and `clientY`.
- The heatmap normalizes saved click coordinates against the current dashboard viewport size for a simple visual approximation.
- Session identity is anonymous and stored only in browser `localStorage`.
- Authentication is out of scope for this assignment.

## Trade-offs

- The heatmap uses a simple dot overlay instead of a third-party heatmap library, as required.
- Timestamps are stored as ISO strings for simple API output and sorting compatibility with ISO-formatted dates.
- The dashboard keeps filtering client-side because the assignment data size is expected to be small.

## Folder Structure

```text
analytics-app/
|-- backend/
|   |-- app.py
|   |-- requirements.txt
|   `-- test.py
|-- demo/
|   `-- index.html
|-- frontend/
|   |-- index.html
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.js
|   `-- src/
|       |-- components/
|       |   |-- EmptyState.jsx
|       |   |-- ErrorState.jsx
|       |   `-- LoadingState.jsx
|       |-- pages/
|       |   |-- HeatmapView.jsx
|       |   |-- SessionDetailsView.jsx
|       |   `-- SessionsView.jsx
|       |-- services/
|       |   `-- api.js
|       |-- styles/
|       |   `-- global.css
|       |-- App.jsx
|       `-- main.jsx
|-- tracker/
|   `-- tracker.js
|-- .gitignore
`-- README.md
```


