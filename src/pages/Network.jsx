import React, { useState, useEffect, useCallback } from 'react';
import * as apiClient from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Filter, Users, GraduationCap, Award,
  BookUser, Plus, Trash2, ChevronDown, Check, FolderOpen,
  X, Pencil, MoreHorizontal, Star, UserCheck, UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import DoctorCard from '@/components/cards/DoctorCard';
import { contacts as contactsApi } from '@/api/client';

// ── Follows API helpers ────────────────────────────────────────────────────────
// FIX: use 'authToken' — that's the key your app actually stores the JWT under
const getToken = () => localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';

const followsApi = {
  bulkStats: (userIds) =>
    fetch('/api/follows/bulk-stats', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body:    JSON.stringify({ user_ids: userIds }),
    }).then(r => r.json()),

  toggle: (targetUserId) =>
    fetch(`/api/follows/${targetUserId}`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()),
};

// ── Constants ──────────────────────────────────────────────────────────────────
const specialties = [
  "All Specialties","General Medicine","Cardiology","Neurology","Pediatrics",
  "Orthopedics","Dermatology","Psychiatry","Radiology","Surgery",
  "Emergency Medicine","Oncology","Gynecology","Ophthalmology","ENT",
  "Anesthesiology","Other",
];

const GROUP_COLORS = [
  { value:'teal',   label:'Teal',   bg:'bg-teal-100',   text:'text-teal-700',   border:'border-teal-200'   },
  { value:'blue',   label:'Blue',   bg:'bg-blue-100',   text:'text-blue-700',   border:'border-blue-200'   },
  { value:'violet', label:'Violet', bg:'bg-violet-100', text:'text-violet-700', border:'border-violet-200' },
  { value:'rose',   label:'Rose',   bg:'bg-rose-100',   text:'text-rose-700',   border:'border-rose-200'   },
  { value:'amber',  label:'Amber',  bg:'bg-amber-100',  text:'text-amber-700',  border:'border-amber-200'  },
  { value:'slate',  label:'Slate',  bg:'bg-slate-100',  text:'text-slate-600',  border:'border-slate-200'  },
];

const colorStyle = (color) => GROUP_COLORS.find(c => c.value === color) || GROUP_COLORS[0];

// ── FollowButton ───────────────────────────────────────────────────────────────
function FollowButton({ doctor, followStats, onToggle }) {
  const userId = doctor.user_id;
  if (!userId) return null;

  const stats       = followStats[userId] || { is_following: false, follower_count: 0 };
  const isFollowing = stats.is_following;

  return (
    <Button
      size="sm"
      variant={isFollowing ? "default" : "outline"}
      className={`gap-1.5 text-xs h-8 transition-all flex-1 ${
        isFollowing
          ? 'bg-teal-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-white group'
          : 'hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700'
      }`}
      onClick={() => onToggle(userId)}
      title={isFollowing ? 'Unfollow' : 'Follow'}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5 group-hover:hidden" />
          <UserPlus  className="w-3.5 h-3.5 hidden group-hover:block" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        <><UserPlus className="w-3.5 h-3.5" />Follow</>
      )}
      {stats.follower_count > 0 && (
        <span className={`text-xs ml-0.5 ${isFollowing ? 'text-white/80' : 'text-slate-400'}`}>
          {stats.follower_count}
        </span>
      )}
    </Button>
  );
}

// ── ColorPicker ────────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {GROUP_COLORS.map(c => (
        <button key={c.value} type="button" onClick={() => onChange(c.value)}
          className={`w-7 h-7 rounded-full border-2 transition-all ${c.bg} ${
            value === c.value ? 'border-slate-600 scale-110' : 'border-transparent hover:scale-105'
          }`} title={c.label} />
      ))}
    </div>
  );
}

// ── GroupFormDialog ────────────────────────────────────────────────────────────
function GroupFormDialog({ open, onClose, onSubmit, initial }) {
  const [name,  setName]  = useState(initial?.name  || '');
  const [color, setColor] = useState(initial?.color || 'teal');

  useEffect(() => {
    if (open) { setName(initial?.name || ''); setColor(initial?.color || 'teal'); }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Rename group' : 'New contact group'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; onSubmit(name.trim(), color); }}
              className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Group name</label>
            <Input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Cardiology colleagues" maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>{initial ? 'Save' : 'Create group'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── ContactsSidebar ────────────────────────────────────────────────────────────
function ContactsSidebar({ groups, onCreateGroup, onRenameGroup, onDeleteGroup,
                           onRemoveMember, selectedGroupId, onSelectGroup }) {
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const totalUnique   = [...new Set(groups.flatMap(g => g.members.map(m => m.user_id)))].length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">My contacts</h2>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={onCreateGroup}>
          <Plus className="w-3.5 h-3.5" /> New group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mb-3">
            <FolderOpen className="w-6 h-6 text-teal-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No groups yet</p>
          <p className="text-xs text-slate-400 mt-1">Create a group and add doctors from the network</p>
        </div>
      ) : (
        <div className="space-y-1 overflow-y-auto flex-1">
          <button onClick={() => onSelectGroup(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
              selectedGroupId === null ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
            }`}>
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">All contacts</span>
            <span className="text-xs text-slate-400">{totalUnique}</span>
          </button>
          <div className="border-t border-slate-100 my-2" />
          {groups.map(group => {
            const cs = colorStyle(group.color);
            const isSelected = selectedGroupId === group.id;
            return (
              <div key={group.id} className="group/item relative">
                <button onClick={() => onSelectGroup(group.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    isSelected ? `${cs.bg} ${cs.text} font-medium` : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cs.bg} border ${cs.border}`} />
                  <span className="flex-1 truncate">{group.name}</span>
                  <span className="text-xs text-slate-400">{group.member_count}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-slate-200 transition-all">
                      <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onRenameGroup(group)} className="gap-2">
                      <Pencil className="w-3.5 h-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDeleteGroup(group.id)}
                      className="gap-2 text-red-600 focus:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" /> Delete group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {selectedGroup && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{selectedGroup.name}</p>
          {selectedGroup.members.length === 0
            ? <p className="text-xs text-slate-400 px-1">No members yet.</p>
            : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {selectedGroup.members.map(m => (
                  <div key={m.user_id} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-slate-50 group/member">
                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700 flex-shrink-0">
                      {m.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{m.full_name}</p>
                      {m.specialty && <p className="text-xs text-slate-400 truncate">{m.specialty}</p>}
                    </div>
                    <button onClick={() => onRemoveMember(selectedGroup.id, m.user_id)}
                      className="opacity-0 group-hover/member:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

// ── AddToGroupPopover ──────────────────────────────────────────────────────────
function AddToGroupPopover({ doctor, groups, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);

  const membershipMap = {};
  groups.forEach(g => {
    if (g.members.some(m => m.email === doctor.created_by)) membershipMap[g.id] = true;
  });
  const inAnyGroup = Object.keys(membershipMap).length > 0;

  return (
    <div className="relative flex-1">
      <Button
        size="sm"
        variant={inAnyGroup ? "default" : "outline"}
        className={`gap-1.5 text-xs h-8 w-full ${inAnyGroup ? 'bg-teal-500 hover:bg-teal-600 text-white' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <BookUser className="w-3.5 h-3.5" />
        {inAnyGroup ? 'In contacts' : 'Add to group'}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg w-52 py-1.5 overflow-hidden">
            {groups.length === 0
              ? <p className="text-xs text-slate-400 px-3 py-2 text-center">No groups yet. Create one first.</p>
              : groups.map(group => {
                  const cs       = colorStyle(group.color);
                  const isMember = membershipMap[group.id];
                  return (
                    <button key={group.id}
                      onClick={() => isMember ? onRemove(group.id, doctor.id) : onAdd(group.id, doctor.created_by)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cs.bg} border ${cs.border}`} />
                      <span className="flex-1 text-slate-700 truncate">{group.name}</span>
                      {isMember && <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />}
                    </button>
                  );
                })
            }
          </div>
        </>
      )}
    </div>
  );
}

// ── DoctorCardWrapper ──────────────────────────────────────────────────────────
// FIX: action row moved BELOW the card so Follow + Add-to-group sit side by side
// without overlapping the card content.
function DoctorCardWrapper({ doctor, followStats, onToggleFollow, onMessage, groups, onAdd, onRemove, onViewProfile }) {
  const userId      = doctor.user_id;
  const stats       = userId ? (followStats[userId] || { is_following: false, follower_count: 0 }) : null;
  const isFollowing = stats?.is_following ?? false;

  return (
    <div className="relative group/card flex flex-col">
      {/* Amber star badge for followed doctors */}
      {isFollowing && (
        <div className="absolute -top-1.5 -left-1.5 z-10">
          <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <Star className="w-3.5 h-3.5 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Card with optional amber ring when following */}
      <div className={`rounded-2xl transition-all duration-200 ${isFollowing ? 'ring-2 ring-amber-300/60 ring-offset-1' : ''}`}>
        <DoctorCard
          doctor={doctor}
          onMessage={() => onMessage(doctor)}
          isOnline={doctor.online_status === 'online'}
          onNameClick={() => onViewProfile(doctor)}
        />
      </div>

      {/* Action row — below the card, both buttons visible side by side */}
      <div className="flex items-center gap-2 mt-2 px-1">
        {userId && (
          <FollowButton
            doctor={doctor}
            followStats={followStats}
            onToggle={onToggleFollow}
          />
        )}
        <AddToGroupPopover
          doctor={doctor}
          groups={groups}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}

// ── PublicProfileModal ─────────────────────────────────────────────────────────
function PublicProfileModal({ doctor, followStats, onToggleFollow, onMessage, onClose }) {
  if (!doctor) return null;
  const userId        = doctor.user_id;
  const stats         = userId ? (followStats[userId] || { is_following: false, follower_count: 0 }) : null;
  const isFollowing   = stats?.is_following ?? false;
  const followerCount = stats?.follower_count ?? 0;
  const visibility    = doctor.profile_visibility || 'public';

  return (
    <Dialog open={!!doctor} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Doctor Profile</DialogTitle>
        </DialogHeader>

        {visibility !== 'public' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Private Profile</h3>
            <p className="text-slate-500 mt-1 text-sm">This doctor has set their profile to private.</p>
          </div>
        ) : (
          <div className="space-y-5 mt-1">
            {/* Avatar + name */}
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                {doctor.profile_photo
                  ? <img src={doctor.profile_photo} alt={doctor.full_name}
                      className="w-20 h-20 rounded-2xl object-cover" />
                  : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-2xl font-bold text-white">
                      {doctor.full_name?.charAt(0)}
                    </div>
                }
                {isFollowing && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 leading-tight">{doctor.full_name}</h2>
                {doctor.specialty && (
                  <p className="text-teal-600 font-medium text-sm mt-0.5">{doctor.specialty}</p>
                )}
                {(doctor.location_city || doctor.location_country) && (
                  <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[doctor.location_city, doctor.location_country].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{followerCount}</span> follower{followerCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Experience', value: doctor.years_experience ? `${doctor.years_experience}y` : '—' },
                { label: 'Responses',  value: doctor.response_count || 0 },
                { label: 'Helpful',    value: doctor.helpful_votes_received || 0 },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {doctor.bio && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">About</p>
                <p className="text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}

            {/* Qualifications */}
            {doctor.qualifications?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Qualifications</p>
                <div className="flex flex-wrap gap-1.5">
                  {doctor.qualifications.map((q, i) => (
                    <Badge key={i} variant="secondary" className="bg-teal-50 text-teal-700 border-0">
                      {typeof q === 'string' ? q : q.degree || JSON.stringify(q)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {doctor.interests?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {doctor.interests.map((interest, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Institution */}
            {doctor.institution_name && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Institution</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{doctor.institution_name}</p>
                {doctor.institution_type && <p className="text-xs text-slate-400">{doctor.institution_type}</p>}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              {userId && (
                <Button
                  className={`flex-1 gap-2 ${
                    isFollowing
                      ? 'bg-teal-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-white'
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                  onClick={() => onToggleFollow(userId)}
                >
                  {isFollowing
                    ? <><UserCheck className="w-4 h-4" />Following</>
                    : <><UserPlus className="w-4 h-4" />Follow</>
                  }
                </Button>
              )}
              <Button variant="outline" className="flex-1 gap-2"
                onClick={() => { onMessage(doctor); onClose(); }}>
                Message
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function Network() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);

  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedLocation,  setSelectedLocation]  = useState('');
  const [sortBy,            setSortBy]            = useState('response_rate');

  const [contactsOpen,    setContactsOpen]    = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupFormOpen,   setGroupFormOpen]   = useState(false);
  const [editingGroup,    setEditingGroup]    = useState(null);

  const [followStats,    setFollowStats]    = useState({});
  const [viewingDoctor,  setViewingDoctor]  = useState(null);

  // ── Load current user ──────────────────────────────────────────────────────
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

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['allDoctors'],
    queryFn:  () => apiClient.entities.DoctorProfile.filter({}, '-created_date'),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['contactGroups'],
    queryFn:  contactsApi.listGroups,
    enabled:  !!user,
  });

  // ── Load follow stats once doctors are fetched ─────────────────────────────
  useEffect(() => {
    if (!user || doctors.length === 0) return;
    const userIds = doctors.map(d => d.user_id).filter(Boolean);
    if (userIds.length === 0) return;
    followsApi.bulkStats(userIds).then(res => {
      if (res.stats) setFollowStats(res.stats);
    });
  }, [user, doctors]);

  // ── Toggle follow ──────────────────────────────────────────────────────────
  const handleToggleFollow = useCallback(async (targetUserId) => {
    const res = await followsApi.toggle(targetUserId);
    if (res.error) return;
    setFollowStats(prev => ({
      ...prev,
      [targetUserId]: {
        is_following:   res.is_following,
        follower_count: res.follower_count,
      },
    }));
  }, []);

  // ── Group mutations ────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contactGroups'] });

  const createGroupMutation  = useMutation({ mutationFn: ({ name, color }) => contactsApi.createGroup(name, color), onSuccess: invalidate });
  const updateGroupMutation  = useMutation({ mutationFn: ({ id, name, color }) => contactsApi.updateGroup(id, { name, color }), onSuccess: invalidate });
  const deleteGroupMutation  = useMutation({ mutationFn: id => contactsApi.deleteGroup(id), onSuccess: () => { invalidate(); if (selectedGroupId !== null) setSelectedGroupId(null); } });
  const addMemberMutation    = useMutation({ mutationFn: ({ groupId, email }) => contactsApi.addMember(groupId, email), onSuccess: invalidate });
  const removeMemberMutation = useMutation({ mutationFn: ({ groupId, userId }) => contactsApi.removeMember(groupId, userId), onSuccess: invalidate });

  const handleCreateGroup  = (name, color) => { createGroupMutation.mutate({ name, color }); setGroupFormOpen(false); };
  const handleRenameGroup  = (name, color) => { if (!editingGroup) return; updateGroupMutation.mutate({ id: editingGroup.id, name, color }); setEditingGroup(null); };
  const handleDeleteGroup  = id => { if (!window.confirm('Delete this group?')) return; deleteGroupMutation.mutate(id); };
  const handleAddMember    = (groupId, email)  => addMemberMutation.mutate({ groupId, email });
  const handleRemoveMember = (groupId, userId) => removeMemberMutation.mutate({ groupId, userId });

  // ── Start conversation ─────────────────────────────────────────────────────
  const startConversation = async (doctor) => {
    if (!user) return;
    const existingConvos = await apiClient.entities.Conversation.filter({
      participants: [user.email, doctor.created_by]
    });
    if (existingConvos.length > 0) { navigate(`/chats?conversationId=${existingConvos[0].id}`); return; }
    const newConvo = await apiClient.entities.Conversation.create({
      participants:      [user.email, doctor.created_by],
      participant_names: [profile?.full_name || user.full_name, doctor.full_name],
      is_group:          false,
    });
    navigate(`/chats?conversationId=${newConvo.id}`);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const followingUserIds = new Set(
    Object.entries(followStats).filter(([, s]) => s.is_following).map(([id]) => Number(id))
  );

  const groupMemberEmails = selectedGroupId === null
    ? null
    : new Set((groups.find(g => g.id === selectedGroupId)?.members || []).map(m => m.email));

  const allContactEmails = selectedGroupId === null && contactsOpen
    ? new Set(groups.flatMap(g => g.members.map(m => m.email)))
    : null;

  const filteredDoctors = doctors.filter(doctor => {
    if (doctor.created_by === user?.email) return false;
    if (groupMemberEmails !== null && !groupMemberEmails.has(doctor.created_by)) return false;
    if (allContactEmails  !== null && !allContactEmails.has(doctor.created_by))  return false;

    const matchesSearch = searchQuery === '' ||
      doctor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.interests?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doctor.qualifications?.some(q => q.degree?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialty = selectedSpecialty === 'All Specialties' || doctor.specialty === selectedSpecialty;
    const matchesLocation  = selectedLocation === '' ||
      doctor.location_city?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      doctor.location_country?.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesSpecialty && matchesLocation;
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    const aFollowed = a.user_id && followingUserIds.has(a.user_id) ? 1 : 0;
    const bFollowed = b.user_id && followingUserIds.has(b.user_id) ? 1 : 0;
    if (bFollowed !== aFollowed) return bFollowed - aFollowed;

    if (sortBy === 'response_rate') {
      const sA = (a.response_count || 0) + (a.helpful_votes_received || 0) + (a.qualifications?.length || 0) * 5;
      const sB = (b.response_count || 0) + (b.helpful_votes_received || 0) + (b.qualifications?.length || 0) * 5;
      return sB - sA;
    }
    if (sortBy === 'qualifications') return (b.qualifications?.length || 0) - (a.qualifications?.length || 0);
    if (sortBy === 'experience')     return (b.years_experience || 0) - (a.years_experience || 0);
    return 0;
  });

  const uniqueLocations = [...new Set(doctors.map(d => d.location_city).filter(Boolean))];
  const totalContacts   = new Set(groups.flatMap(g => g.members.map(m => m.email))).size;
  const followingCount  = followingUserIds.size;

  const activeGroupLabel = selectedGroupId !== null
    ? groups.find(g => g.id === selectedGroupId)?.name
    : contactsOpen ? 'All contacts' : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-7 h-7 text-teal-500" />
                Doctor Network
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-3">
                Connect with {doctors.length} verified doctors
                {followingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Following {followingCount}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, degree..." className="pl-10" />
              </div>

              <Button variant={contactsOpen ? "default" : "outline"}
                className={`gap-2 ${contactsOpen ? 'bg-teal-500 hover:bg-teal-600 text-white' : ''}`}
                onClick={() => { setContactsOpen(o => !o); if (contactsOpen) setSelectedGroupId(null); }}>
                <BookUser className="w-4 h-4" />
                My contacts
                {totalContacts > 0 && (
                  <Badge className={`ml-0.5 text-xs ${contactsOpen ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'}`}>
                    {totalContacts}
                  </Badge>
                )}
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                    {(selectedSpecialty !== 'All Specialties' || selectedLocation) && (
                      <Badge className="bg-teal-500 text-white ml-1">
                        {[selectedSpecialty !== 'All Specialties', selectedLocation].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader><SheetTitle>Filter Doctors</SheetTitle></SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Specialty</label>
                      <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
                          placeholder="City or country" className="pl-10" />
                      </div>
                      {uniqueLocations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {uniqueLocations.slice(0, 5).map(loc => (
                            <Badge key={loc} variant="outline" className="cursor-pointer hover:bg-teal-50"
                                   onClick={() => setSelectedLocation(loc)}>{loc}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort By</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="response_rate">
                            <div className="flex items-center gap-2"><Award className="w-4 h-4" />Response Rate & Qualifications</div>
                          </SelectItem>
                          <SelectItem value="qualifications">
                            <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4" />Most Qualifications</div>
                          </SelectItem>
                          <SelectItem value="experience">Experience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setSelectedSpecialty('All Specialties'); setSelectedLocation(''); setSortBy('response_rate');
                    }}>Clear Filters</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {(selectedSpecialty !== 'All Specialties' || selectedLocation || activeGroupLabel) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeGroupLabel && (
                <Badge variant="secondary" className="gap-1 cursor-pointer bg-teal-50 text-teal-700 border border-teal-200"
                       onClick={() => { setSelectedGroupId(null); setContactsOpen(false); }}>
                  <BookUser className="w-3 h-3" /> {activeGroupLabel} ×
                </Badge>
              )}
              {selectedSpecialty !== 'All Specialties' && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedSpecialty('All Specialties')}>
                  {selectedSpecialty} ×
                </Badge>
              )}
              {selectedLocation && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedLocation('')}>
                  <MapPin className="w-3 h-3" /> {selectedLocation} ×
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">

        {contactsOpen && (
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 sticky top-28 min-h-[400px] flex flex-col">
              <ContactsSidebar
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
                onCreateGroup={() => { setEditingGroup(null); setGroupFormOpen(true); }}
                onRenameGroup={group => { setEditingGroup(group); setGroupFormOpen(true); }}
                onDeleteGroup={handleDeleteGroup}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-slate-200 rounded w-32 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedDoctors.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                {contactsOpen ? <BookUser className="w-10 h-10 text-slate-400" /> : <Users className="w-10 h-10 text-slate-400" />}
              </div>
              <h3 className="text-lg font-semibold text-slate-700">
                {contactsOpen ? 'No contacts in this group' : 'No doctors found'}
              </h3>
              <p className="text-slate-500 mt-1">
                {contactsOpen ? 'Add doctors from the full network view' : 'Try adjusting your filters'}
              </p>
              {contactsOpen && (
                <Button variant="outline" className="mt-4 gap-2"
                        onClick={() => { setContactsOpen(false); setSelectedGroupId(null); }}>
                  <Users className="w-4 h-4" /> Browse all doctors
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                {sortedDoctors.length} doctor{sortedDoctors.length !== 1 ? 's' : ''}
                {activeGroupLabel ? ` in "${activeGroupLabel}"` : ''}
                {followingCount > 0 && !activeGroupLabel && (
                  <span className="ml-2 text-amber-600">
                    · <Star className="w-3 h-3 inline fill-amber-400 text-amber-400 mb-0.5" /> followed doctors shown first
                  </span>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDoctors.map(doctor => (
                  <DoctorCardWrapper
                    key={doctor.id}
                    doctor={doctor}
                    followStats={followStats}
                    onToggleFollow={handleToggleFollow}
                    onMessage={startConversation}
                    groups={groups}
                    onAdd={handleAddMember}
                    onRemove={handleRemoveMember}
                    onViewProfile={setViewingDoctor}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Group form dialog ── */}
      <GroupFormDialog
        open={groupFormOpen}
        onClose={() => { setGroupFormOpen(false); setEditingGroup(null); }}
        onSubmit={editingGroup ? handleRenameGroup : handleCreateGroup}
        initial={editingGroup}
      />

      {/* ── Public profile modal ── */}
      <PublicProfileModal
        doctor={viewingDoctor}
        followStats={followStats}
        onToggleFollow={handleToggleFollow}
        onMessage={startConversation}
        onClose={() => setViewingDoctor(null)}
      />
    </div>
  );
}