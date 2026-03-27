# MediLink - Healthcare Collaboration Platform

**About**

MediLink is a healthcare collaboration platform that enables seamless communication and case management between doctors and patients.

**Prerequisites:**

1. Clone the repository using the project's Git URL
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create a `.env.local` file and set the backend URL:

```
VITE_API_BASE_URL=http://localhost:5000
```

**Running the app locally:**

```bash
npm install
npm run dev
```

The app will run on `http://localhost:5173`

**Backend Setup**

Ensure the Flask backend (FLASK_MED_PLATFORM) is running on `http://localhost:5000`

**API Communication**

The frontend communicates with the backend through REST API endpoints defined in `src/api/api.js`. All requests are routed through the configured `VITE_API_BASE_URL` environment variable.
