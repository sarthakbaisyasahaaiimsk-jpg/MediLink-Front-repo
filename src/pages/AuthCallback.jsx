import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext.jsx';
import { getOrCreateKeyPair, publicKeyToBase64 } from '@/utils/crypto';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://medilink-back-repo-1.onrender.com';

async function registerE2EKey(userEmail) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token || !userEmail) return;

    const { publicKeyRaw } = await getOrCreateKeyPair();
    const myPubKeyB64 = publicKeyToBase64(publicKeyRaw);

    await fetch(`${API_BASE}/api/keys/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userEmail, public_key: myPubKeyB64 }),
    });
  } catch (err) {
    console.warn('E2E key registration failed:', err);
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { saveToken, fetchUser, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('starting...');

  useEffect(() => {
    async function handleToken() {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        setStatus('token: ' + (token ? token.slice(0, 20) + '...' : 'NOT FOUND'));

        if (!token) {
          setError('No token found in URL');
          return;
        }

        saveToken(token);
        setStatus('token saved, fetching user...');
        const user = await fetchUser();
        setStatus('fetchUser done, user: ' + JSON.stringify(user));

        // Register E2E key now that token is saved and we have the user's email
        if (user?.email) {
          await registerE2EKey(user.email);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to log in: ' + err.message);
        setStatus('error: ' + err.message);
      }
    }

    handleToken();
  }, []);

  useEffect(() => {
    setStatus(prev => prev + ' | isAuthenticated: ' + isAuthenticated);
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md text-center">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-teal-600 font-semibold">Logging in, please wait...</p>
        )}
        <p className="text-xs text-slate-400 mt-2">{status}</p>
      </div>
    </div>
  );
}