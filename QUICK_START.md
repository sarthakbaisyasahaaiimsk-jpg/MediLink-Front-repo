# 🚀 Quick Start Guide

## Step 1: Start Backend (Terminal 1)

```bash
cd C:\Users\sarth\Downloads\flask_med_platform

# Activate virtual environment
venv\Scripts\activate

# Run Flask server
python app.py
```

✅ **Expected output:**
```
Running on https://medilink-back-repo-1.onrender.com
```

---

## Step 2: Start Frontend (Terminal 2)

```bash
cd C:\Users\sarth\MediLink

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

✅ **Expected output:**
```
Local:   https://medilink-front-repo.onrender.com
```

---

## Step 3: Test in Browser

1. Open **https://medilink-front-repo.onrender.com**
2. You should see MediLink homepage
3. Click **"Sign Up"** or **"Login"**

---

## Step 4: Test Authentication

### Create Account
- Email: `test@example.com`
- Password: `password123`
- Click "Sign Up"

### Login
- Use the same credentials
- Store the JWT token (you'll see it in browser DevTools → Application → localStorage → authToken)

---

## Step 5: Verify API Communication

Open **Browser DevTools** (F12) → **Network** tab

### Test Case: Create a Doctor Profile
1. After logging in, go to **Profile**
2. Fill in doctor details
3. Click **"Save Profile"**

### What to look for in Network tab:
- Request to `https://medilink-back-repo-1.onrender.com`
- Request method: `POST`
- Status: `200` or `201` (success)
- Response includes profile data

---

## Step 6: Test File Upload

1. In **Profile**, upload a photo
2. Check Network tab for:
   - Request to `https://medilink-back-repo-1.onrender.com`
   - Status: `200`
   - Response with `file_url`

---

## Debugging Checklist

### If you see "404 Not Found"
```
❌ Route doesn't exist
✅ Solution: Check backend is running on https://medilink-back-repo-1.onrender.com
✅ Solution: Verify route is registered in app.py
```

### If you see "401 Unauthorized"
```
❌ Missing or invalid JWT token
✅ Solution: Log in again
✅ Solution: Check localStorage has 'authToken'
```

### If you see "CORS Error"
```
❌ Backend rejecting frontend requests
✅ Solution: Restart backend after CORS config changes
✅ Solution: Check frontend is on https://medilink-front-repo.onrender.com
```

### If backend won't start
```
❌ Virtual environment not activated
✅ Solution: venv\Scripts\activate (Windows PowerShell)
✅ Solution: Check Python version: python --version (need 3.8+)
```

---

## Quick API Test with curl (Check endpoints work)

### Test login endpoint:
```bash
curl -X POST https://medilink-back-repo-1.onrender.com ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}"
```

### Expected response:
```json
{
  "access_token": "eyJ0eXAi...",
  "token": "eyJ0eXAi...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "test"
  }
}
```

---

## Common Ports

| Service | URL | Port |
|---------|-----|------|
| Frontend | https://medilink-front-repo.onrender.com | |
| Backend | https://medilink-back-repo-1.onrender.com | |
| Database | SQLite (file-based) | N/A |

---

## Next Steps

1. ✅ Both services running
2. ✅ Authentication working (token in localStorage)
3. ✅ API calls completing without CORS errors
4. ✅ Database operations (create, read, update, delete)
5. 👉 **Test all features:**
   - Create doctor profile
   - Create patient case
   - Send messages
   - Create medical events

See **BACKEND_SETUP.md** for complete API documentation.
