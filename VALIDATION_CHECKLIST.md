# ✅ Pre-Launch Validation Checklist

Use this checklist to verify everything is set up correctly before running the application.

---

## Frontend Validation

### 1. Dependencies Installed
```bash
cd C:\Users\sarth\MediLink
npm list | grep "@base44" # Should return: (empty)
```
✅ **Expected:** No Base44 packages

### 2. Environment Configuration
```bash
# Check .env.local exists
dir .env.local
```
✅ **Expected:** File exists at `C:\Users\sarth\MediLink\.env.local`

### 3. Verify .env.local Content
```bash
type .env.local
```
✅ **Expected Output:**
```
# MediLink Frontend Configuration
# Backend API URL - Update this to match your Flask backend URL
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Check API Client
```bash
# Verify client.js exists
dir src\api\client.js
```
✅ **Expected:** File exists with 350+ lines of code

### 5. Check Base44 Imports Removed
```bash
# Search for remaining base44 references
findstr /r "base44" *.jsx *.js src\*.* src\**\*.* 2>NUL
```
✅ **Expected:** No results found (except in .git/node_modules)

### 6. Build Test
```bash
npm run build
```
✅ **Expected:** Build completes without errors, `dist/` folder created

---

## Backend Validation

### 1. Virtual Environment
```bash
# Navigate to backend
cd C:\Users\sarth\Downloads\flask_med_platform

# Check venv exists
dir venv\
```
✅ **Expected:** `venv/` folder exists

### 2. Python Version
```bash
venv\Scripts\activate
python --version
```
✅ **Expected:** Python 3.8 or higher

### 3. Dependencies Installed
```bash
pip list | findstr "flask flask-cors flask-jwt"
```
✅ **Expected Output:** Shows:
- Flask
- Flask-Cors
- Flask-JWT-Extended
- Flask-SQLAlchemy

### 4. App Structure
```bash
# Check all key files exist
dir app.py config.py models.py extensions.py
dir routes\
```
✅ **Expected:** All files present

### 5. Routes Registered
```bash
# Check routes folder has all files
dir routes\*.py
```
✅ **Expected:** Should include:
- auth.py
- doctor_profiles.py
- patient_cases.py
- case_comments.py
- conversations.py
- messages_api.py
- medical_events.py
- uploads.py
- messages.py (legacy)
- groups.py (legacy)
- cases.py (legacy)
- workshops.py (legacy)

### 6. Database Models
```bash
# Read models.py and check for:
# User, DoctorProfile, PatientCase, Message, Conversation, etc.
```
✅ **Expected:** All 8+ models defined with `to_dict()` methods

---

## Port Availability

### 1. Check Port 5000 (Backend)
```bash
netstat -ano | findstr ":5000"
```
✅ **Expected:** No results (port is free)

### 2. Check Port 5173 (Frontend)
```bash
netstat -ano | findstr ":5173"
```
✅ **Expected:** No results (port is free)

---

## Configuration Verification

### 1. Flask CORS Setup
Check `app.py` contains:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```
✅ **Status:** ✅ Verified in app.py

### 2. JWT Configuration
Check `extensions.py` or `app.py` contains:
```python
jwt.init_app(app)
```
✅ **Status:** ✅ Verified in app.py

### 3. Database Configuration
Check `config.py` contains:
```python
SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
```
✅ **Status:** ✅ Verified in config.py

### 4. Uploads Directory
Check backend will create:
```python
os.makedirs("uploads", exist_ok=True)
```
✅ **Status:** ✅ Verified in app.py

---

## API Client Verification

### 1. Auth Methods
Check `src/api/client.js` exports:
- ✅ `auth.login(email, password)`
- ✅ `auth.register(userData)`
- ✅ `auth.me()`
- ✅ `auth.logout()`

### 2. Entity Methods
Check `src/api/client.js` exports:
- ✅ `entities.DoctorProfile.filter()`
- ✅ `entities.DoctorProfile.get(id)`
- ✅ `entities.DoctorProfile.create()`
- ✅ `entities.DoctorProfile.update()`
- ✅ `entities.DoctorProfile.delete()`
- ✅ `entities.PatientCase.*` (same 5 methods)
- ✅ `entities.CaseComment.*` (same 5 methods)
- ✅ `entities.Conversation.*` (same 5 methods)
- ✅ `entities.Message.*` (same 5 methods)
- ✅ `entities.MedicalEvent.*` (same 5 methods)

### 3. File Upload
Check `src/api/client.js` exports:
- ✅ `uploadFile(file)` returns `{ file_url, filename, filepath }`

---

## File Upload Verification

### 1. Backend Upload Handler
Check file exists:
```bash
dir routes\uploads.py
```
✅ **Expected:** File exists

### 2. Upload Directory Creation
Check `app.py` has:
```python
os.makedirs("uploads", exist_ok=True)
```
✅ **Status:** ✅ Verified

### 3. Allowed Extensions
Check `routes/uploads.py` contains:
```python
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls'}
```
✅ **Status:** ✅ Verified

---

## Documentation Verification

### 1. Setup Guides
```bash
dir BACKEND_SETUP.md QUICK_START.md MIGRATION_SUMMARY.md
```
✅ **Expected:** All 3 files present

### 2. README Quality
- ✅ QUICK_START.md - Step-by-step testing
- ✅ BACKEND_SETUP.md - API reference with examples
- ✅ MIGRATION_SUMMARY.md - Complete change history

---

## Pre-Launch Checklist

### Frontend
- [ ] No @base44 dependencies in package.json
- [ ] .env.local exists with VITE_API_BASE_URL
- [ ] src/api/client.js exists (350+ lines)
- [ ] All page components updated (no base44 imports)
- [ ] npm run build completes successfully

### Backend
- [ ] Python 3.8+ installed
- [ ] Virtual environment created and activated
- [ ] All dependencies installed (pip list)
- [ ] app.py imports all route blueprints
- [ ] models.py has all 8+ models with to_dict()
- [ ] routes/ folder has 8 new files
- [ ] Port 5000 is available

### Configuration
- [ ] CORS configured for localhost:5173
- [ ] JWT initialized in app.py
- [ ] Database URI configured in config.py
- [ ] Upload directory creation in app.py
- [ ] All route blueprints registered with /api prefix

### API Client
- [ ] src/api/client.js has all auth methods
- [ ] src/api/client.js has all entity operations
- [ ] src/api/client.js has uploadFile function
- [ ] apiCall() helper includes Bearer token

### Documentation
- [ ] QUICK_START.md is readable
- [ ] BACKEND_SETUP.md has all endpoints documented
- [ ] MIGRATION_SUMMARY.md explains all changes

---

## Quick Pre-Launch Test

### Test Backend Import
```bash
cd C:\Users\sarth\Downloads\flask_med_platform
venv\Scripts\activate
python -c "from app import create_app; print('✅ Backend imports OK')"
```
✅ **Expected:** ✅ Backend imports OK

### Test Frontend Build
```bash
cd C:\Users\sarth\MediLink
npm run build
```
✅ **Expected:** Build succeeds, creates dist/ folder

---

## Ready to Launch? 

If all checkboxes are ✅, you're ready!

### Launch Backend
```bash
cd C:\Users\sarth\Downloads\flask_med_platform
venv\Scripts\activate
python app.py
# Expected: Running on http://127.0.0.1:5000
```

### Launch Frontend (New Terminal)
```bash
cd C:\Users\sarth\MediLink
npm run dev
# Expected: Local: http://localhost:5173/
```

### Open in Browser
Go to **http://localhost:5173**

---

## Troubleshooting

### ❌ "Module not found: @base44/sdk"
```
Solution: Delete node_modules/ and reinstall
rm -r node_modules
npm install
```

### ❌ "Port 5000 already in use"
```
Solution: Find process using port 5000
netstat -ano | findstr ":5000"
taskkill /PID <PID> /F
```

### ❌ "Virtual environment not activated"
```
Solution: Always activate before running
cd C:\Users\sarth\Downloads\flask_med_platform
venv\Scripts\activate
```

### ❌ "ModuleNotFoundError: No module named 'flask'"
```
Solution: Install dependencies
venv\Scripts\activate
pip install -r requirements.txt
```

### ❌ "CORS error in browser console"
```
Solution: 
1. Ensure frontend is on http://localhost:5173
2. Ensure backend CORS includes http://localhost:5173
3. Restart backend after CORS changes
```

### ❌ "401 Unauthorized error"
```
Solution:
1. Log in to get token
2. Check localStorage.authToken exists
3. Backend checks Authorization header includes "Bearer "
```

---

**Status:** ✅ **Ready for Testing**

Proceed to [QUICK_START.md](QUICK_START.md) for detailed testing steps!
