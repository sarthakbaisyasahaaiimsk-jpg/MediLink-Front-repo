import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext.jsx';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { saveToken, fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      saveToken(token); // store in localStorage / context
      fetchUser().then(() => navigate('/dashboard'));
    } else {
      navigate('/login'); // fallback
    }
  }, [searchParams]);

  return <div className="flex items-center justify-center h-screen">Loading...</div>;
}