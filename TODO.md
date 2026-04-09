# Fix 422 Error on /api/auth/me

## Steps:
- [x] 1. Create .env file with VITE_API_BASE_URL=https://medilink-back-repo-1.onrender.com
- [x] 1. Create .env file with VITE_API_BASE_URL=https://medilink-back-repo-1.onrender.com
- [x] 2. Fix API_BASE_URL default in src/api/client.js  
- [x] 3. Backend: Handle missing JWT in /me endpoint gracefully (return 401 instead of 422)
- [ ] 4. Restart Vite dev server AND Backend server
- [ ] 5. Test https://medilink-front-repo.onrender.com - check browser console/Network tab: expect 401 on /api/auth/me (handled as unauth)
- [ ] 6. Verify login/auth flow works
- [ ] 7. Mark complete

**Status:** Backend fix applied - restart both servers and test

