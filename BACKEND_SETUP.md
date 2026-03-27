# MediLink - Complete Setup Guide

## Project Overview
- **Frontend:** React + Vite (runs on `http://localhost:5173`)
- **Backend:** Flask + SQLAlchemy (runs on `http://localhost:5000`)
- **Database:** SQLite
- **Authentication:** JWT tokens

---

## Backend Setup (Flask_MED_PLATFORM)

### Prerequisites
- Python 3.8+
- pip package manager

### Installation Steps

```bash
# Navigate to backend folder
cd C:\Users\sarth\Downloads\flask_med_platform

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

### Configuration
Edit `config.py` if needed for your database:
```python
SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'  # SQLite database
```

### Run Backend
```bash
# Make sure virtual environment is activated
python app.py
```
Backend runs on: **`http://localhost:5000`**

### Database Models Created
- ✅ User - Email authentication
- ✅ DoctorProfile - Doctor details and qualifications
- ✅ PatientCase - Medical case submissions
- ✅ CaseComment - Comments on cases with voting
- ✅ Conversation - Chat conversations
- ✅ Message - Individual messages
- ✅ MedicalEvent - Medical events and conferences
- ✅ Workshop - Medical workshops

---

## Frontend Setup (MediLink)

### Prerequisites
- Node.js 18+
- npm package manager

### Installation Steps

```bash
# Navigate to frontend folder
cd C:\Users\sarth\MediLink

# Install dependencies
npm install

# Development server runs on http://localhost:5173
npm run dev
```

### Environment Configuration
File: `.env.local` (already created)
```
VITE_API_BASE_URL=http://localhost:5000
```

### Build for Production
```bash
npm run build
npm run preview  # Preview production build
```

---

## API Endpoints Reference

All endpoints require `/api` prefix and JWT authentication (except login/register)

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login (returns JWT token)
GET    /api/auth/me            - Get current user (JWT required)
```

**Login Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "doctor",
    "email": "doctor@example.com",
    "full_name": "Dr. John Doe"
  }
}
```

### Doctor Profiles
```
GET    /api/doctor-profiles              - List profiles (filter: created_by, specialty)
GET    /api/doctor-profiles/<id>         - Get single profile
POST   /api/doctor-profiles              - Create profile (JWT required)
PUT    /api/doctor-profiles/<id>         - Update profile (JWT required)
DELETE /api/doctor-profiles/<id>         - Delete profile (JWT required)
```

### Patient Cases
```
GET    /api/patient-cases                - List cases (filter: created_by, status, specialty)
GET    /api/patient-cases/<id>           - Get single case
POST   /api/patient-cases                - Create case (JWT required)
PUT    /api/patient-cases/<id>           - Update case (JWT required)
DELETE /api/patient-cases/<id>           - Delete case (JWT required)
```

### Case Comments
```
GET    /api/case-comments                - List comments (filter: case_id, commenter_id)
GET    /api/case-comments/<id>           - Get single comment
POST   /api/case-comments                - Create comment (JWT required)
PUT    /api/case-comments/<id>           - Update comment (JWT required)
DELETE /api/case-comments/<id>           - Delete comment (JWT required)
POST   /api/case-comments/<id>/reply     - Add reply to comment (JWT required)
```

### Conversations
```
GET    /api/conversations                - List user conversations (JWT required)
GET    /api/conversations/<id>           - Get single conversation
POST   /api/conversations                - Create conversation (JWT required)
PUT    /api/conversations/<id>           - Update conversation (JWT required)
DELETE /api/conversations/<id>           - Delete conversation (JWT required)
```

### Messages
```
GET    /api/messages                     - List messages (filter: conversation_id, sender_id)
GET    /api/messages/<id>                - Get single message
POST   /api/messages                     - Send message (JWT required)
PUT    /api/messages/<id>                - Update message (JWT required)
DELETE /api/messages/<id>                - Delete message (JWT required)
```

### Medical Events
```
GET    /api/medical-events               - List events (filter: event_type, specialty, is_online)
GET    /api/medical-events/<id>          - Get single event
POST   /api/medical-events               - Create event (JWT required)
PUT    /api/medical-events/<id>          - Update event (JWT required)
DELETE /api/medical-events/<id>          - Delete event (JWT required)
```

### File Upload
```
POST   /api/upload                       - Upload file (JWT required)
```

---

## Frontend API Client Usage

All requests go through `src/api/client.js`

### Authentication
```javascript
import * as apiClient from '@/api/client';

// Login
const result = await apiClient.auth.login('email@example.com', 'password');
// Returns: { access_token, token, user }

// Get current user
const user = await apiClient.auth.me();
// Returns: { id, username, email, full_name }

// Logout
apiClient.auth.logout(); // Clears token and redirects
```

### Doctor Profiles
```javascript
// Get all profiles
const profiles = await apiClient.entities.DoctorProfile.filter({
  created_by: 'doctor@example.com'
});

// Get single profile
const profile = await apiClient.entities.DoctorProfile.get(1);

// Create profile
await apiClient.entities.DoctorProfile.create({
  created_by: 'doctor@example.com',
  full_name: 'Dr. John Doe',
  specialty: 'Cardiology',
  qualifications: [{ degree: 'MD', institution: 'Harvard', year: 2015 }],
  bio: 'Experienced cardiologist'
});

// Update profile
await apiClient.entities.DoctorProfile.update(1, {
  response_count: 5,
  helpful_votes_received: 10
});

// Delete profile
await apiClient.entities.DoctorProfile.delete(1);
```

### Patient Cases
```javascript
// List cases
const cases = await apiClient.entities.PatientCase.filter({
  status: 'open',
  specialty: 'Cardiology'
}, '-created_date'); // Sort by created_date descending

// Create case
await apiClient.entities.PatientCase.create({
  title: 'Chest Pain Diagnosis',
  chief_complaint: 'Acute chest pain',
  patient_age: 45,
  patient_gender: 'Male',
  question: 'What could be the diagnosis?',
  specialty_tags: ['Cardiology', 'Emergency'],
  created_by: 'patient@example.com'
});

// Update case status
await apiClient.entities.PatientCase.update(1, {
  status: 'resolved',
  discussion_count: 5
});
```

### Case Comments
```javascript
// Get comments for a case
const comments = await apiClient.entities.CaseComment.filter({
  case_id: 1
});

// Create comment
await apiClient.entities.CaseComment.create({
  case_id: 1,
  commenter_id: 'doctor@example.com',
  commenter_name: 'Dr. John Doe',
  commenter_specialty: 'Cardiology',
  content: 'This looks like acute myocardial infarction',
  is_treatment_suggestion: true,
  likes: 0,
  dislikes: 0
});

// Update comment votes
await apiClient.entities.CaseComment.update(1, {
  likes: 5,
  liked_by: ['user1@example.com', 'user2@example.com']
});
```

### Conversations & Messages
```javascript
// Get conversations
const convos = await apiClient.entities.Conversation.filter({});

// Create conversation
const convo = await apiClient.entities.Conversation.create({
  participants: ['doctor@example.com', 'patient@example.com'],
  participant_names: ['Dr. John', 'Patient'],
  is_group: false
});

// Send message
await apiClient.entities.Message.create({
  conversation_id: 1,
  sender_id: 'doctor@example.com',
  sender_name: 'Dr. John',
  content: 'Hello, how are you?',
  read_by: ['doctor@example.com']
});

// Get messages
const messages = await apiClient.entities.Message.filter({
  conversation_id: 1
}, 'created_date'); // Sort ascending
```

### Medical Events
```javascript
// List events
const events = await apiClient.entities.MedicalEvent.filter({
  event_type: 'Conference',
  is_online: false
}, 'date');

// Create event
await apiClient.entities.MedicalEvent.create({
  title: 'Cardiology Conference 2024',
  description: 'Annual cardiology conference',
  event_type: 'Conference',
  date: '2024-06-15T09:00:00Z',
  location_city: 'New York',
  location_country: 'USA',
  venue: 'Grand Central',
  is_online: false,
  is_free: false,
  price: '$99',
  organizer: 'Medical Society'
});
```

### File Upload
```javascript
// Upload file
const result = await apiClient.uploadFile(file);
// Returns: { file_url, filename, filepath }
```

---

## Running Both Services

### Terminal 1 - Backend
```bash
cd C:\Users\sarth\Downloads\flask_med_platform
venv\Scripts\activate
python app.py
# Listens on http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd C:\Users\sarth\MediLink
npm run dev
# Listens on http://localhost:5173
```

Open browser: `http://localhost:5173`

---

## JWT Token Management

### How Token Works
1. User logs in with email/password
2. Backend returns JWT token (valid for ~24 hours)
3. Frontend stores token in `localStorage.authToken`
4. Every request includes: `Authorization: Bearer <token>`
5. Backend validates token before processing request

### Token Storage
- **Key:** `authToken`
- **Location:** Browser localStorage
- **Cleared on:** Logout or token expiration

### Adding Token to Requests
Frontend automatically handles this in `src/api/client.js`:
```javascript
headers: {
  "Authorization": `Bearer ${localStorage.getItem('authToken')}`
}
```

---

## Troubleshooting

### Backend Won't Start
```
Error: Port 5000 already in use
Solution: 
1. Kill the process on port 5000
2. Or change port in app.py: app.run(port=5001)
```

### CORS Issues (Cross-Origin)
```
Error: Access to XMLHttpRequest blocked by CORS policy
Solution: Already configured in app.py for localhost:5173
Check browser console for specific error
```

### Token Unauthorized
```
Error: 401 Unauthorized
Solution:
1. Token may have expired - re-login
2. Clear localStorage.authToken
3. Check if backend is validating tokens correctly
```

### Database Locked
```
Error: database is locked
Solution:
1. Close any open connections
2. Delete instance/app.db and restart
3. Ensure only one app.py is running
```

### API Returns 404
```
Error: 404 Not Found
Solution:
1. Check endpoint URL includes /api prefix
2. Verify routes are registered in app.py
3. Check spelling of endpoint
4. Ensure backend is running on port 5000
```

---

## Development Workflow

1. **Backend changes:**
   - Edit route files in `routes/` folder
   - Changes auto-reload with Flask debug mode
   - No restart needed

2. **Frontend changes:**
   - Edit React components
   - Changes auto-refresh with Vite HMR
   - No manual rebuild needed

3. **Database schema changes:**
   - Update `models.py`
   - Restart backend to apply changes
   - Database tables auto-created on startup

---

## Production Deployment

### Build Frontend
```bash
cd C:\Users\sarth\MediLink
npm run build
# Creates optimized build in dist/ folder
```

### Deploy Backend
```bash
# Set production config
export FLASK_ENV=production

# Deploy to server (example: Heroku, AWS, etc)
# Update CORS origins for production domain
```

### Update Environment Variables
```
VITE_API_BASE_URL=https://your-production-backend.com
```

---

## Project Structure

```
MediLink (Frontend)
├── src/
│   ├── api/
│   │   ├── api.js           # Event-specific endpoints
│   │   └── client.js        # Main API client (USE THIS)
│   ├── pages/               # Page components
│   ├── components/          # React components
│   ├── lib/                 # Utilities
│   └── App.jsx              # Main app
└── .env.local               # Environment config

flask_med_platform (Backend)
├── routes/
│   ├── auth.py
│   ├── doctor_profiles.py
│   ├── patient_cases.py
│   ├── case_comments.py
│   ├── medical_events.py
│   ├── conversations.py
│   ├── messages_api.py
│   └── uploads.py
├── models.py                # Database models
├── app.py                   # Flask app entry
├── config.py                # Configuration
└── requirements.txt         # Python dependencies
```

---

## Support & Documentation

- Frontend: React + Vite
- Backend: Flask + SQLAlchemy
- API: REST with JWT authentication
- Database: SQLite
- State Management: React Context + React Query

All API calls documented above with examples!