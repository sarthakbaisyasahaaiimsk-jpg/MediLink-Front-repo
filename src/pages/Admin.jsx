import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { admin as adminApi } from '@/api/client';
import { Button } from '@/components/ui/button';

const TABS = ['Dashboard', 'Users', 'Cases', 'Events', 'Chats', 'Networking', 'References' , 'Prescriptions'];

const Badge = ({ state }) => {
  const colors = {
    verified:   'bg-green-100 text-green-800',
    pending:    'bg-amber-100 text-amber-800',
    rejected:   'bg-red-100 text-red-800',
    open:       'bg-blue-100 text-blue-800',
    closed:     'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[state] || 'bg-gray-100 text-gray-600'}`}>
      {state}
    </span>
  );
};

const ConfirmBtn = ({ label, variant = 'outline', onConfirm }) => {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return (
    <span className="flex gap-1">
      <Button size="sm" variant="destructive" onClick={() => { onConfirm(); setConfirming(false); }}>Yes</Button>
      <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>No</Button>
    </span>
  );
  return <Button size="sm" variant={variant} onClick={() => setConfirming(true)}>{label}</Button>;
};

// ── DASHBOARD ──────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminApi.getAnalytics().then(setStats); }, []);
  if (!stats) return <p className="text-sm text-slate-400">Loading...</p>;
  const cards = [
    ['Total users', stats.total_users],
    ['Verified', stats.verified_users],
    ['Pending', stats.pending_users],
    ['Cases', stats.total_cases],
    ['Open cases', stats.open_cases],
    ['Events', stats.total_events],
    ['Conversations', stats.total_conversations],
    ['Messages', stats.total_messages],
    ['References', stats.total_references],
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(([label, val]) => (
        <div key={label} className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-medium">{val}</p>
        </div>
      ))}
    </div>
  );
};

// ── USERS ───────────────────────────────────────────
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getUsers().then(d => { setUsers(d); setLoading(false); }); }, []);

  const verify   = async id => { const r = await adminApi.verifyUser(id);   setUsers(p => p.map(u => u.id === id ? r.user : u)); };
  const del      = async id => { await adminApi.deleteUser(id);              setUsers(p => p.filter(u => u.id !== id)); };
  const togAdmin = async id => { const r = await adminApi.toggleAdmin(id);   setUsers(p => p.map(u => u.id === id ? { ...u, is_admin: r.is_admin } : u)); };

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
          <th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Email</th>
          <th className="p-2">Role</th><th className="p-2">State</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b hover:bg-slate-50">
              <td className="p-2 text-slate-400">{u.id}</td>
              <td className="p-2">{u.full_name || '—'}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.is_admin ? <Badge state="verified" /> : 'doctor'}</td>
              <td className="p-2"><Badge state={u.verification_state} /></td>
              <td className="p-2 flex gap-1 flex-wrap">
                {!u.is_verified && <Button size="sm" onClick={() => verify(u.id)}>Verify</Button>}
                <Button size="sm" variant="outline" onClick={() => togAdmin(u.id)}>
                  {u.is_admin ? 'Remove admin' : 'Make admin'}
                </Button>
                <ConfirmBtn label="Delete" variant="destructive" onConfirm={() => del(u.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── CASES ───────────────────────────────────────────
const Cases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getCases().then(d => { setCases(d); setLoading(false); }); }, []);

  const del        = async id => { await adminApi.deleteCase(id); setCases(p => p.filter(c => c.id !== id)); };
  const setStatus  = async (id, status) => { const r = await adminApi.updateCaseStatus(id, status); setCases(p => p.map(c => c.id === id ? r.case : c)); };

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
          <th className="p-2">ID</th><th className="p-2">Title</th><th className="p-2">By</th>
          <th className="p-2">Status</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id} className="border-b hover:bg-slate-50">
              <td className="p-2 text-slate-400">{c.id}</td>
              <td className="p-2 max-w-xs truncate">{c.title}</td>
              <td className="p-2 text-xs text-slate-500">{c.created_by}</td>
              <td className="p-2"><Badge state={c.status} /></td>
              <td className="p-2 flex gap-1 flex-wrap">
                {c.status === 'open'
                  ? <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'closed')}>Close</Button>
                  : <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'open')}>Reopen</Button>}
                <ConfirmBtn label="Delete" variant="destructive" onConfirm={() => del(c.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── EVENTS ──────────────────────────────────────────
const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getEvents().then(d => { setEvents(d); setLoading(false); }); }, []);
  const del = async id => { await adminApi.deleteEvent(id); setEvents(p => p.filter(e => e.id !== id)); };

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
          <th className="p-2">ID</th><th className="p-2">Title</th><th className="p-2">Date</th>
          <th className="p-2">Organizer</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id} className="border-b hover:bg-slate-50">
              <td className="p-2 text-slate-400">{e.id}</td>
              <td className="p-2 max-w-xs truncate">{e.title}</td>
              <td className="p-2 text-xs">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
              <td className="p-2 text-xs text-slate-500">{e.organizer}</td>
              <td className="p-2"><ConfirmBtn label="Delete" variant="destructive" onConfirm={() => del(e.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── CHATS ───────────────────────────────────────────
const Chats = () => {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getConversations().then(d => { setConvs(d); setLoading(false); }); }, []);
  const del = async id => { await adminApi.deleteConversation(id); setConvs(p => p.filter(c => c.id !== id)); };

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
          <th className="p-2">ID</th><th className="p-2">Participants</th><th className="p-2">Last message</th>
          <th className="p-2">Group</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {convs.map(c => (
            <tr key={c.id} className="border-b hover:bg-slate-50">
              <td className="p-2 text-slate-400">{c.id}</td>
              <td className="p-2 text-xs max-w-xs truncate">{Array.isArray(c.participants) ? c.participants.join(', ') : c.participants}</td>
              <td className="p-2 text-xs text-slate-500 max-w-xs truncate">{c.last_message || '—'}</td>
              <td className="p-2">{c.is_group ? <Badge state="verified" /> : '—'}</td>
              <td className="p-2"><ConfirmBtn label="Delete" variant="destructive" onConfirm={() => del(c.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── NETWORKING ──────────────────────────────────────
const Networking = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getProfiles().then(d => { setProfiles(d); setLoading(false); }); }, []);
  const del = async id => { await adminApi.deleteProfile(id); setProfiles(p => p.filter(x => x.id !== id)); };

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
          <th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Specialty</th>
          <th className="p-2">Location</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {profiles.map(p => (
            <tr key={p.id} className="border-b hover:bg-slate-50">
              <td className="p-2 text-slate-400">{p.id}</td>
              <td className="p-2">{p.full_name}</td>
              <td className="p-2 text-xs">{p.specialty}</td>
              <td className="p-2 text-xs text-slate-500">{[p.location_city, p.location_country].filter(Boolean).join(', ')}</td>
              <td className="p-2"><ConfirmBtn label="Delete" variant="destructive" onConfirm={() => del(p.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── REFERENCES ──────────────────────────────────────
const References = () => {
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.getReferences().then(d => { setRefs(d); setLoading(false); }); }, []);
  const del = async id => { await adminApi.deleteReference(id); setRefs(p => p.filter(r => r.id !== id)); };

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
          <th className="p-2">PMID</th><th className="p-2">Title</th><th className="p-2">Year</th>
          <th className="p-2">Saved</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {refs.map(r => (
            <tr key={r.id} className="border-b hover:bg-slate-50">
              <td className="p-2 text-slate-400">{r.pmid}</td>
              <td className="p-2 max-w-xs truncate">{r.title}</td>
              <td className="p-2 text-xs">{r.year}</td>
              <td className="p-2 text-xs text-slate-500">{new Date(r.saved_at).toLocaleDateString()}</td>
              <td className="p-2"><ConfirmBtn label="Delete" variant="destructive" onConfirm={() => del(r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── PRESCRIPTIONS ───────────────────────────────────
const Prescriptions = () => {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const fetchList = () => {
    setListLoading(true);
    fetch('/api/prescriptions/list', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(d => { setList(d); setListLoading(false); })
      .catch(() => setListLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch {
      setError('Invalid JSON — please check the format.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess(`Saved: ${data.disease}`);
      setJson('');
      fetchList();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/prescriptions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    fetchList();
  };

  const TEMPLATE = JSON.stringify({
    disease: "Disease Name",
    icd_code: "A00",
    source: "WHO / ICMR 2024",
    last_updated: "2024",
    medications: [
      { drug: "Drug Name", dose: "Xmg once daily", duration: "X days" }
    ],
    contraindications: [
      "Condition: reason"
    ],
    patient_groups: [
      { name: "Pregnancy", note: "Special instruction here" }
    ]
  }, null, 2);

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">Upload guideline JSON</p>
        <button
          className="text-xs text-slate-400 underline"
          onClick={() => setJson(TEMPLATE)}
        >
          Load template
        </button>
        <textarea
          className="w-full font-mono text-xs border rounded-lg p-3 h-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Paste guideline JSON here…"
          value={json}
          onChange={e => setJson(e.target.value)}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving…' : 'Save to DB'}
        </Button>
      </div>

      {/* Existing guidelines */}
      <div>
        <p className="text-sm font-medium mb-3">Saved guidelines</p>
        {listLoading
          ? <p className="text-sm text-slate-400">Loading...</p>
          : list.length === 0
            ? <p className="text-sm text-slate-400">No guidelines saved yet.</p>
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                    <th className="p-2">Disease</th>
                    <th className="p-2">ICD</th>
                    <th className="p-2">Source</th>
                    <th className="p-2">Updated</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(rx => (
                    <tr key={rx.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium">{rx.disease}</td>
                      <td className="p-2 text-slate-400">{rx.icd_code}</td>
                      <td className="p-2 text-xs text-slate-500">{rx.source}</td>
                      <td className="p-2 text-xs">{rx.last_updated}</td>
                      <td className="p-2">
                        <ConfirmBtn label="Delete" variant="destructive" onConfirm={() => handleDelete(rx.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </div>
    </div>
  );
};

// ── MAIN ADMIN PAGE ─────────────────────────────────
const TAB_COMPONENTS = { Dashboard, Users, Cases, Events, Chats, Networking, References, Prescriptions };

export default function Admin() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');

  if (isLoadingAuth) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <Navigate to="/" replace />;

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-52 border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Admin</p>
          <p className="text-sm font-medium mt-0.5">{user.full_name || user.email}</p>
        </div>
        <nav className="flex-1 py-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2 text-sm border-l-2 transition-colors
                ${activeTab === tab
                  ? 'border-slate-800 bg-slate-50 text-slate-900 font-medium'
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-xl font-medium mb-5">{activeTab}</h1>
        <ActiveComponent />
      </main>
    </div>
  );
}

