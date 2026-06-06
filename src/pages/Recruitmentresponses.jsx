import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, User, FileText, CheckCircle2, XCircle,
  Clock, Download, Mail, Building2, MapPin, Briefcase,
  DollarSign, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// ─── API helpers ──────────────────────────────────────────────────────────────

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const API = {
  getJob: (id) =>
    fetch(`/api/recruitment/jobs/${id}`, { headers: authHeader() }).then(r => r.json()),

  getApplications: (id) =>
    fetch(`/api/recruitment/jobs/${id}/applications`, { headers: authHeader() }).then(r => r.json()),

  updateStatus: (appId, status) =>
    fetch(`/api/recruitment/applications/${appId}/status`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => r.json()),

  deactivateJob: (id) =>
    fetch(`/api/recruitment/jobs/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    }).then(r => r.json()),
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-100 text-amber-700',  icon: Clock },
  shortlisted: { label: 'Shortlisted', color: 'bg-teal-100 text-teal-700',    icon: CheckCircle2 },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700',      icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────

function ApplicationCard({ app, onStatusChange }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {app.applicant_name || 'Applicant'}
            </p>
            <a
              href={`mailto:${app.applicant_email}`}
              className="text-xs text-teal-600 hover:underline flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              {app.applicant_email}
            </a>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {app.cover_letter && (
        <div className="bg-slate-50 rounded-xl p-3 mb-3">
          <p className="text-xs font-medium text-slate-500 mb-1">Cover Letter</p>
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
            {app.cover_letter}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-3">
          {app.cv_url && (
            <a
              href={app.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-orange-500 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download CV
            </a>
          )}
          <span className="text-xs text-slate-400">
            {new Date(app.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>

        <Select
          defaultValue={app.status}
          onValueChange={v => onStatusChange(app.id, v)}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shortlisted">Shortlist</SelectItem>
            <SelectItem value="rejected">Reject</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecruitmentResponses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => API.getJob(id),
    enabled: !!id,
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', id],
    queryFn: () => API.getApplications(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ appId, status }) => API.updateStatus(appId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['applications', id]);
      toast({ title: 'Status updated' });
    },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => API.deactivateJob(id),
    onSuccess: () => {
      toast({ title: 'Job listing closed' });
      navigate('/recruitment');
    },
  });

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  const counts = {
    all:         applications.length,
    pending:     applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected:    applications.filter(a => a.status === 'rejected').length,
  };

  const formatSalary = () => {
    if (!job) return null;
    if (!job.salary_min && !job.salary_max) return null;
    const fmt = n =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: job.salary_currency || 'INR',
        maximumFractionDigits: 0,
      }).format(n);
    if (job.salary_min && job.salary_max)
      return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} / ${job.salary_period}`;
    return `${fmt(job.salary_min || job.salary_max)} / ${job.salary_period}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 pb-24">
      {/* Back bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <button
          onClick={() => navigate('/recruitment')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recruitment
        </button>
      </div>

      {/* Job summary header */}
      {job && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold leading-tight mb-2">
                  {job.title}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-teal-100 text-sm">
                  {job.institution && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {job.institution}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                  )}
                  {formatSalary() && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatSalary()}
                    </span>
                  )}
                  {job.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Deadline: {new Date(job.deadline).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 bg-white/10 border-white/30 text-white hover:bg-red-500/80 hover:border-red-400"
                onClick={() => {
                  if (window.confirm('Close this job listing? It will no longer appear to applicants.')) {
                    deactivateMutation.mutate();
                  }
                }}
              >
                Close Listing
              </Button>
            </div>

            {/* Aggregate stats */}
            <div className="grid grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Total', value: counts.all, color: 'bg-white/20' },
                { label: 'Pending', value: counts.pending, color: 'bg-amber-400/30' },
                { label: 'Shortlisted', value: counts.shortlisted, color: 'bg-teal-300/30' },
                { label: 'Rejected', value: counts.rejected, color: 'bg-red-400/30' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-teal-100">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {[
            { key: 'all',         label: `All (${counts.all})` },
            { key: 'pending',     label: `Pending (${counts.pending})` },
            { key: 'shortlisted', label: `Shortlisted (${counts.shortlisted})` },
            { key: 'rejected',    label: `Rejected (${counts.rejected})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex-1 text-xs py-2 rounded-lg transition-colors font-medium ${
                filter === t.key
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Applications will appear here once doctors apply
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                onStatusChange={(appId, status) =>
                  statusMutation.mutate({ appId, status })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}