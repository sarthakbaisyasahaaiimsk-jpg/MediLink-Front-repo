import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import * as apiClient from '@/api/client';
import { Button } from '@/components/ui/button';

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      apiClient.auth.me();
      apiClient.auth
        .getAdminUsers?.() // potentially we will add this helper
        .then(setUsers)
        .catch(err => setError(err.message || 'Unable to load users.'));
    }
  }, [isAuthenticated, user]);

  const verifyUser = async (userId) => {
    try {
      await apiClient.auth.adminVerifyUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: true, verification_state:'verified' } : u));
    } catch (err) {
      setError(err.message || 'Failed to verify user');
    }
  };

  if (!isAuthenticated) {
    return <div className="p-4">Please log in as admin.</div>;
  }

  if (!user?.is_admin) {
    return <div className="p-4">Admin access only.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="mt-4 border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.full_name}</td>
                <td className="p-2">{u.is_admin ? 'admin' : 'doctor'}</td>
                <td className="p-2">{u.verification_state}</td>
                <td className="p-2">
                  {!u.is_verified && (
                    <Button size="sm" onClick={() => verifyUser(u.id)}>Verify</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
