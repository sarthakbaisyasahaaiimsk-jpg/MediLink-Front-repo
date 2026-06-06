import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import * as apiClient from '@/api/client';
import {
  Briefcase, MapPin, Clock, DollarSign, Plus, Search,
  Filter, ChevronRight, Building2, Calendar, Users,
  ArrowRight, CheckCircle2, XCircle, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = {
  listJobs: () =>
    fetch('/api/recruitment/jobs', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()),

  myJobs: () =>
    fetch('/api/recruitment/jobs/mine', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()),

  createJob: (data) =>
    fetch('/api/recruitment/jobs', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  applyJob: (jobId, formData) =>
    fetch(`/api/recruitment/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    }).then(r => r.json()),

  myApplications: () =>
    fetch('/api/recruitment/applications/mine', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()),
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'locum', label: 'Locum' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'internship', label: 'Internship' },
];

const SPECIALTIES = [
  'General Practice', 'Internal Medicine', 'Surgery', 'Paediatrics',
  'Obstetrics & Gynaecology', 'Cardiology', 'Neurology', 'Oncology',
  'Radiology', 'Anaesthesiology', 'Psychiatry', 'Emergency Medicine',
  'Dermatology', 'Ophthalmology', 'Orthopaedics', 'Other',
];

const TYPE_COLORS = {
  'full-time':  'bg-teal-100 text-teal-700',
  'part-time':  'bg-blue-100 text-blue-700',
  'locum':      'bg-amber-100 text-amber-700',
  'fellowship': 'bg-purple-100 text-purple-700',
  'internship': 'bg-pink-100 text-pink-700',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function JobCard({ job, onApply, onView, currentUserEmail }) {
  const isOwner = job.posted_by === currentUserEmail;

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return 'Salary not disclosed';
    const fmt = (n) =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: job.salary_currency || 'INR',
        maximumFractionDigits: 0,
      }).format(n);
    if (job.salary_min && job.salary_max)
      return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} / ${job.salary_period}`;
    return `${fmt(job.salary_min || job.salary_max)} / ${job.salary_period}`;
  };

  const daysLeft = () => {
    if (!job.deadline) return null;
    const diff = Math.ceil(
      (new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? `${diff}d left` : 'Deadline passed';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-base leading-snug mb-1 truncate">
            {job.title}
          </h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{job.institution || 'Institution not listed'}</span>
          </div>
        </div>
        <Badge
          className={`text-xs flex-shrink-0 ${TYPE_COLORS[job.employment_type] || 'bg-slate-100 text-slate-600'}`}
        >
          {job.employment_type}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-slate-500">
        {job.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        {job.specialty && (
          <div className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="truncate">{job.specialty}</span>
          </div>
        )}
        <div className="flex items-center gap-1 col-span-2">
          <DollarSign className="w-3.5 h-3.5" />
          <span className="truncate">{formatSalary()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {job.application_count != null && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {job.application_count} applied
            </span>
          )}
          {daysLeft() && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {daysLeft()}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {isOwner ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(job)}
              className="text-teal-600 border-teal-200 hover:bg-teal-50 text-xs"
            >
              View Responses
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onApply(job)}
              className="bg-teal-600 hover:bg-orange-400 text-white text-xs"
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


function PostJobModal({ open, onClose, onSuccess }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '', institution: '', location: '', employment_type: '',
    specialty: '', description: '', requirements: '',
    salary_min: '', salary_max: '', salary_currency: 'INR',
    salary_period: 'monthly', contact_email: '', deadline: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => API.createJob({
      ...form,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
    }),
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Job posted!', description: 'Your listing is now live.' });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: 'Failed to post job', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Post a Job Opening</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Job Title *</label>
            <Input
              placeholder="e.g. Senior Cardiologist"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Institution</label>
              <Input
                placeholder="Hospital / Clinic name"
                value={form.institution}
                onChange={e => set('institution', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Location</label>
              <Input
                placeholder="City, State"
                value={form.location}
                onChange={e => set('location', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Employment Type</label>
              <Select onValueChange={v => set('employment_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Specialty</label>
              <Select onValueChange={v => set('specialty', v)}>
                <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Salary Range</label>
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={form.salary_min}
                onChange={e => set('salary_min', e.target.value)}
              />
              <Input
                placeholder="Max"
                type="number"
                value={form.salary_max}
                onChange={e => set('salary_max', e.target.value)}
              />
              <Select defaultValue="INR" onValueChange={v => set('salary_currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['INR', 'USD', 'GBP', 'EUR', 'AED'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="monthly" onValueChange={v => set('salary_period', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">/ month</SelectItem>
                  <SelectItem value="annual">/ year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Job Description *</label>
            <Textarea
              rows={4}
              placeholder="Describe the role, responsibilities, and what makes this opportunity unique…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Requirements</label>
            <Textarea
              rows={3}
              placeholder="Qualifications, experience, certifications required…"
              value={form.requirements}
              onChange={e => set('requirements', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Contact Email</label>
              <Input
                type="email"
                placeholder="hr@hospital.com"
                value={form.contact_email}
                onChange={e => set('contact_email', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Application Deadline</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-orange-400 text-white"
              disabled={!form.title || !form.description || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Posting…' : 'Post Job'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ApplyModal({ job, open, onClose, onSuccess }) {
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState(null);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('cover_letter', coverLetter);
      if (cvFile) fd.append('cv', cvFile);
      return API.applyJob(job.id, fd);
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Application submitted!', description: 'Good luck!' });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: 'Submission failed', variant: 'destructive' }),
  });

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Apply — {job.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 -mt-1">
          {job.institution} · {job.location}
        </p>

        <div className="space-y-4 mt-3">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Cover Letter
            </label>
            <Textarea
              rows={5}
              placeholder="Tell the employer why you are a great fit…"
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Upload CV / Resume (PDF)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              onChange={e => setCvFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-orange-400 text-white"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Submitting…' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Recruitment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPostJob, setShowPostJob] = useState(false);
  const [applyTarget, setApplyTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('browse'); // browse | mine | applied

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: API.listJobs,
  });

  const { data: myJobs = [] } = useQuery({
    queryKey: ['myJobs'],
    queryFn: API.myJobs,
    enabled: activeTab === 'mine',
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ['myApplications'],
    queryFn: API.myApplications,
    enabled: activeTab === 'applied',
  });

  const filtered = jobs.filter(j => {
    const matchSearch =
      !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.institution?.toLowerCase().includes(search.toLowerCase()) ||
      j.specialty?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || j.employment_type === filterType;
    return matchSearch && matchType;
  });

  const STATUS_BADGE = {
    pending:     'bg-amber-100 text-amber-700',
    shortlisted: 'bg-teal-100 text-teal-700',
    rejected:    'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                Medical Recruitment
              </h1>
              <p className="mt-2 text-teal-100 text-sm md:text-base">
                Find clinical opportunities or hire talented doctors
              </p>
            </div>
            <Button
              onClick={() => setShowPostJob(true)}
              className="bg-white text-teal-600 hover:bg-orange-400 hover:text-white flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              Post a Job
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Open Positions', value: jobs.filter(j => j.is_active).length },
              { label: 'Specialties', value: [...new Set(jobs.map(j => j.specialty).filter(Boolean))].length },
              { label: 'Institutions', value: [...new Set(jobs.map(j => j.institution).filter(Boolean))].length },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-teal-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {[
            { key: 'browse', label: 'Browse Jobs' },
            { key: 'mine',   label: 'My Postings' },
            { key: 'applied', label: 'My Applications' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 text-sm py-2 rounded-lg transition-colors font-medium ${
                activeTab === t.key
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Browse Tab ── */}
        {activeTab === 'browse' && (
          <>
            {/* Search + filter */}
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Search by title, institution, specialty…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select defaultValue="all" onValueChange={setFilterType}>
                <SelectTrigger className="w-36">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EMPLOYMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No positions found</p>
                <p className="text-sm text-slate-400 mt-1">Try a different search or post an opening</p>
                <Button
                  className="mt-4 bg-teal-600 hover:bg-orange-400 text-white"
                  onClick={() => setShowPostJob(true)}
                >
                  Post a Job
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    currentUserEmail={user?.email}
                    onApply={j => setApplyTarget(j)}
                    onView={j => navigate(`/recruitment/responses/${j.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Postings Tab ── */}
        {activeTab === 'mine' && (
          <>
            {myJobs.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No job postings yet</p>
                <p className="text-sm text-slate-400 mt-1">Post your first opening and find the right doctor</p>
                <Button
                  className="mt-4 bg-teal-600 hover:bg-orange-400 text-white"
                  onClick={() => setShowPostJob(true)}
                >
                  Post a Job
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    currentUserEmail={user?.email}
                    onApply={() => {}}
                    onView={j => navigate(`/recruitment/responses/${j.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Applications Tab ── */}
        {activeTab === 'applied' && (
          <>
            {myApplications.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No applications yet</p>
                <p className="text-sm text-slate-400 mt-1">Browse openings and apply</p>
                <Button
                  className="mt-4 bg-teal-600 hover:bg-orange-400 text-white"
                  onClick={() => setActiveTab('browse')}
                >
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myApplications.map(app => (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{app.job_title || 'Position'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Applied {new Date(app.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    {app.cover_letter && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{app.cover_letter}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <PostJobModal
        open={showPostJob}
        onClose={() => setShowPostJob(false)}
        onSuccess={() => queryClient.invalidateQueries(['jobs', 'myJobs'])}
      />
      <ApplyModal
        job={applyTarget}
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        onSuccess={() => queryClient.invalidateQueries(['myApplications'])}
      />
    </div>
  );
}