import React, { useState, useEffect } from 'react';
import * as apiClient from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Search, Plus, Filter, Briefcase, Tag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import CaseCard from '@/components/cards/CaseCard';
import NewCaseForm from '@/components/cases/NewCaseForm';

const specialties = [
  "All", "General Medicine", "Cardiology", "Neurology", "Pediatrics",
  "Orthopedics", "Dermatology", "Psychiatry", "Radiology", "Surgery",
  "Emergency Medicine", "Oncology", "Gynecology", "Ophthalmology", "ENT", "Other"
];

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';

// ── Fetch the set of emails the current user follows ──────────────────────────
async function fetchFollowingEmails() {
  try {
    const res = await fetch('/api/follows/following', {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    // data.following is array of user_ids; we need to map to emails.
    // We'll return user_ids and resolve in-component against the cases' created_by emails.
    return data.following || [];
  } catch {
    return [];
  }
}

// ── Fetch user id → email map for a list of user_ids ─────────────────────────
// Since cases store created_by as email, we fetch doctor profiles to map
// user_id → email using the already-loaded doctors endpoint.
// The simplest approach: fetch all doctor profiles and build the map there.

export default function Cases() {
  const [user,          setUser]          = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [showNewCase,   setShowNewCase]   = useState(false);

  // Following: set of emails whose posts get starred
  const [followingEmails, setFollowingEmails] = useState(new Set());

  useEffect(() => {
    const loadUser = async () => {
      const u = await apiClient.auth.me();
      setUser(u);
      if (!u) return;
      const profiles = await apiClient.entities.DoctorProfile.filter({ created_by: u.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    };
    loadUser();
  }, []);

  // Once user is loaded, resolve following user_ids → emails via doctor profiles
  useEffect(() => {
    if (!user) return;
    const resolve = async () => {
      const followingIds = await fetchFollowingEmails(); // actually user_ids
      if (followingIds.length === 0) return;

      // Fetch all doctor profiles to map user_id → created_by (email)
      const allProfiles = await apiClient.entities.DoctorProfile.filter({});
      const idToEmail = {};
      allProfiles.forEach(p => {
        if (p.user_id) idToEmail[p.user_id] = p.created_by;
      });

      const emails = new Set(
        followingIds.map(id => idToEmail[id]).filter(Boolean)
      );
      setFollowingEmails(emails);
    };
    resolve();
  }, [user]);

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ['allCases'],
    queryFn:  () => apiClient.entities.PatientCase.filter({}, '-created_date'),
  });

  const filteredCases = cases.filter(c => {
    const matchesSearch = searchQuery === '' ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.question?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus    = statusFilter === 'all' || c.status === statusFilter;
    const matchesSpecialty = specialtyFilter === 'All' || c.specialty_tags?.includes(specialtyFilter);

    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  // Pin followed-user cases to top
  const sortedCases = [...filteredCases].sort((a, b) => {
    const aFollowed = followingEmails.has(a.created_by) ? 1 : 0;
    const bFollowed = followingEmails.has(b.created_by) ? 1 : 0;
    return bFollowed - aFollowed;
  });

  const followedCases = sortedCases.filter(c => followingEmails.has(c.created_by));
  const hasFollowed   = followedCases.length > 0;

  const handleNewCaseCreated = () => { setShowNewCase(false); refetch(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-7 h-7 text-teal-500" />
                Patient Cases
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-3">
                Discuss challenging cases with peers
                {followingEmails.size > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    From people you follow shown first
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search cases..." className="pl-10" />
              </div>

              <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-500 hover:bg-teal-600 gap-2">
                    <Plus className="w-4 h-4" />New Case
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit a New Case</DialogTitle>
                  </DialogHeader>
                  <NewCaseForm profile={profile} onSuccess={handleNewCaseCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-48">
                <Tag className="w-4 h-4 mr-2" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedCases.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No cases found</h3>
            <p className="text-slate-500 mt-1">Be the first to submit a case for discussion</p>
            <Button className="mt-4 bg-teal-500 hover:bg-teal-600" onClick={() => setShowNewCase(true)}>
              <Plus className="w-4 h-4 mr-2" />Submit a Case
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Followed section */}
            {hasFollowed && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <h2 className="text-sm font-semibold text-amber-700">From doctors you follow</h2>
                  <div className="flex-1 h-px bg-amber-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {followedCases.map(patientCase => (
                    <div key={patientCase.id} className="relative">
                      {/* Star badge */}
                      <div className="absolute -top-1.5 -left-1.5 z-10 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                      <div className="ring-2 ring-amber-300/60 ring-offset-1 rounded-2xl">
                        <CaseCard
                          patientCase={patientCase}
                          onClick={() => window.location.href = createPageUrl(`CaseDetails?id=${patientCase.id}`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All / remaining cases */}
            {hasFollowed && sortedCases.length > followedCases.length && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-slate-500">All cases</h2>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(hasFollowed
                ? sortedCases.filter(c => !followingEmails.has(c.created_by))
                : sortedCases
              ).map(patientCase => (
                <CaseCard
                  key={patientCase.id}
                  patientCase={patientCase}
                  onClick={() => window.location.href = createPageUrl(`CaseDetails?id=${patientCase.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}