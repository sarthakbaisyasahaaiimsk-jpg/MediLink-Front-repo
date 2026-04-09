// src/pages/AuthCallback.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext.jsx';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { saveToken, fetchUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleToken() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
          setError('No token found in URL');
          return;
        }

        // Save token to localStorage
        saveToken(token);

        // Fetch user data from backend — sets isAuthenticated = true
        await fetchUser();

        // ✅ Navigate to '/' which exists in App.jsx (was '/dashboard' which doesn't exist)
        navigate('/');
      } catch (err) {
        console.error(err);
        setError('Failed to log in');
      }
    }

    handleToken();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md text-center">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-teal-600 font-semibold">Logging in, please wait...</p>
        )}
      </div>
    </div>
  );
}