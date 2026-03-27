import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { saveToken, fetchUser, doLogin, doRegister } = useAuth();
  const navigate = useNavigate();

  // Email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const result = await doLogin(email, password);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.token || result?.access_token) {
        saveToken(result.token || result.access_token);
        await fetchUser();
        navigate('/dashboard');
        return;
      }
      setError('Login failed: invalid server response - ' + JSON.stringify(result));
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  // Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const userData = {
        username,
        email,
        password,
        phone,
        full_name: fullName,
        admin_code: adminCode
      };
      const result = await doRegister(userData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.token || result?.access_token) {
        saveToken(result.token || result.access_token);
        await fetchUser();
        navigate('/dashboard');
        return;
      }
      setError('Registration failed: invalid server response - ' + JSON.stringify(result));
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  // Google login
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{mode === 'login' ? 'Login' : 'Register'}</h2>

        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 py-2 rounded ${mode === 'login' ? 'bg-teal-600 text-white' : 'bg-slate-100'}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 rounded ${mode === 'register' ? 'bg-teal-600 text-white' : 'bg-slate-100'}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <Button className="w-full mb-4" variant="outline" onClick={handleGoogleLogin}>
          Sign in with Google
        </Button>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Login</Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label>Admin Code (Optional)</Label>
              <Input value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="Enter admin key" />
            </div>
            <Button type="submit" className="w-full">Register</Button>
          </form>
        )}

        {error && <p className="text-red-600 mt-3">{error}</p>}
        {success && <p className="text-green-600 mt-3">{success}</p>}

        <div className="mt-4 text-sm text-slate-500">
          Admin Panel: <a className="text-teal-600" href="/admin">Go to admin dashboard</a>
        </div>
      </div>
    </div>
  );
}