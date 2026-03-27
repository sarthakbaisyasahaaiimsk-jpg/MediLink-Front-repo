# Frontend-Backend Communication Setup

## ✅ Changes Made

### 1. **Removed Base44 References**
- Removed `@base44/sdk` and `@base44/vite-plugin` from `package.json`
- Removed Base44 plugin from `vite.config.js`
- Updated `index.html` title to "MediLink - Healthcare Collaboration Platform"
- Updated project name from "base44-app" to "medilink"

### 2. **Created API Client**
- New file: `src/api/client.js` - Comprehensive API client with support for:
  - Authentication (login, logout, current user)
  - Doctor Profiles
  - Patient Cases
  - Case Comments
  - Conversations
  - Messages
  - Medical Events
  - All methods support CRUD operations with proper error handling

### 3. **Updated Page Components**
- `src/pages/CaseDetails.jsx` - Now uses `apiClient` instead of `base44`
- `src/pages/Profile.jsx` - Now uses `apiClient` instead of `base44`

### 4. **Environment Configuration**
- Created `.env.local` with `VITE_API_BASE_URL=http://localhost:5000`

## 🚀 Setup Instructions

### Frontend Setup
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```
The frontend will run on `http://localhost:5173`

### Backend Setup
Ensure your Flask backend (FLASK_MED_PLATFORM) is running on `http://localhost:5000`

The backend should have these API endpoints:
- `/auth/me` - Get current user
- `/doctor-profiles` - Doctor profile CRUD operations
- `/patient-cases` - Patient case CRUD operations
- `/case-comments` - Case comment CRUD operations
- `/conversations` - Conversation operations
- `/messages` - Message operations
- `/medical-events` - Medical event operations

## 🔌 API Communication

All API requests are made through the centralized `apiClient`:

```javascript
import * as apiClient from '@/api/client';

// Usage examples:
const user = await apiClient.auth.me();
const profiles = await apiClient.entities.DoctorProfile.filter({ created_by: email });
const cases = await apiClient.entities.PatientCase.filter({ id: caseId });
```

### Environment Variables
- `VITE_API_BASE_URL` - Base URL for Flask backend (default: `http://localhost:5000`)

## ✨ Features of New API Client

1. **Centralized Configuration** - All API calls go through single `apiCall` helper
2. **Error Handling** - Proper error messages and exception handling
3. **Authentication** - Automatic Bearer token injection for authenticated requests
4. **Entities Namespace** - Backward compatible with existing code using `entities.*`
5. **Flexible Filtering** - Support for complex query parameters and sorting

## 📝 Next Steps

1. Update your Flask backend to expose these API endpoints
2. Configure CORS on the backend to accept requests from `http://localhost:5173`
3. Run both frontend and backend
4. Test API communication by checking browser console for any errors
