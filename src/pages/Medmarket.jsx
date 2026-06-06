import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Filter, Star, Eye, MessageSquare,
  Globe, Phone, Mail, Tag, Package, Pill, Stethoscope,
  GraduationCap, Monitor, MoreHorizontal, X, ChevronLeft,
  ChevronRight, Upload, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// ─── API helpers ──────────────────────────────────────────────────────────────

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const API = {
  listListings: (category, search) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    return fetch(`/api/medmarket/listings?${params}`, { headers: authHeader() }).then(r => r.json());
  },

  getListing: (id) =>
    fetch(`/api/medmarket/listings/${id}`, { headers: authHeader() }).then(r => r.json()),

  createListing: (formData) =>
    fetch('/api/medmarket/listings', {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    }).then(r => r.json()),

  enquire: (id, message) =>
    fetch(`/api/medmarket/listings/${id}/enquire`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }).then(r => r.json()),

  myListings: () =>
    fetch('/api/medmarket/listings/mine', { headers: authHeader() }).then(r => r.json()),
};

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'all',       label: 'All',            icon: Tag },
  { value: 'equipment', label: 'Equipment',       icon: Package },
  { value: 'pharma',    label: 'Pharma & Supply', icon: Pill },
  { value: 'service',   label: 'Services',        icon: Stethoscope },
  { value: 'education', label: 'Education',       icon: GraduationCap },
  { value: 'software',  label: 'Software',        icon: Monitor },
  { value: 'other',     label: 'Other',           icon: MoreHorizontal },
];

const CATEGORY_COLORS = {
  equipment: 'bg-blue-100 text-blue-700',
  pharma:    'bg-emerald-100 text-emerald-700',
  service:   'bg-purple-100 text-purple-700',
  education: 'bg-amber-100 text-amber-700',
  software:  'bg-indigo-100 text-indigo-700',
  other:     'bg-slate-100 text-slate-600',
};

const PRICE_TYPES = [
  { value: 'fixed',      label: 'Fixed Price' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'contact',    label: 'Contact for Price' },
  { value: 'free',       label: 'Free' },
];

// ─── Image carousel ───────────────────────────────────────────────────────────

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
        <Package className="w-10 h-10 text-slate-300" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-100">
      <img
        src={images[idx]}
        alt="listing"
        className="w-full h-full object-cover"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing, onEnquire, onViewDetail }) {
  const formatPrice = () => {
    if (listing.price_type === 'free') return 'Free';
    if (listing.price_type === 'contact') return 'Contact for price';
    if (!listing.price) return listing.price_type === 'negotiable' ? 'Negotiable' : '—';
    const fmt = new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: listing.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(listing.price);
    return listing.price_type === 'negotiable' ? `${fmt} (Negotiable)` : fmt;
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
        listing.is_featured ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-100'
      }`}
    >
      {listing.is_featured && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 text-white text-xs font-semibold px-3 py-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Featured Listing
        </div>
      )}

      <div className="p-4">
        <ImageCarousel images={listing.images} />

        <div className="mt-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
              {listing.title}
            </h3>
            <Badge className={`text-xs flex-shrink-0 ${CATEGORY_COLORS[listing.category] || 'bg-slate-100 text-slate-600'}`}>
              {CATEGORIES.find(c => c.value === listing.category)?.label || listing.category}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mb-2">
            {listing.description}
          </p>

          <div className="text-base font-semibold text-teal-600 mb-3">
            {formatPrice()}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {listing.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {listing.enquiry_count || 0} enquiries
              </span>
            </div>
            {listing.location && (
              <span className="truncate ml-2">{listing.location}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs border-slate-200 hover:border-teal-300 hover:text-teal-600"
              onClick={() => onViewDetail(listing)}
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-teal-600 hover:bg-orange-400 text-white"
              onClick={() => onEnquire(listing)}
            >
              Enquire
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Listing Detail Modal ─────────────────────────────────────────────────────

function ListingDetailModal({ listing, open, onClose, onEnquire }) {
  if (!listing) return null;

  const formatPrice = () => {
    if (listing.price_type === 'free') return 'Free';
    if (listing.price_type === 'contact') return 'Contact for price';
    if (!listing.price) return listing.price_type === 'negotiable' ? 'Negotiable' : '—';
    const fmt = new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: listing.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(listing.price);
    return listing.price_type === 'negotiable' ? `${fmt} (Negotiable)` : fmt;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg pr-6">{listing.title}</DialogTitle>
        </DialogHeader>

        {listing.images?.length > 0 && (
          <div className="rounded-xl overflow-hidden h-52">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs ${CATEGORY_COLORS[listing.category] || ''}`}>
              {CATEGORIES.find(c => c.value === listing.category)?.label || listing.category}
            </Badge>
            {listing.condition && (
              <Badge variant="outline" className="text-xs">
                Condition: {listing.condition}
              </Badge>
            )}
            {listing.is_featured && (
              <Badge className="text-xs bg-amber-100 text-amber-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>

          <div>
            <p className="text-2xl font-bold text-teal-600">{formatPrice()}</p>
            {listing.location && (
              <p className="text-sm text-slate-500 mt-0.5">{listing.location}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Description</p>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700 mb-2">Contact Details</p>
            {listing.contact_email && (
              <a
                href={`mailto:${listing.contact_email}`}
                className="flex items-center gap-2 text-sm text-teal-600 hover:underline"
              >
                <Mail className="w-4 h-4" />
                {listing.contact_email}
              </a>
            )}
            {listing.contact_phone && (
              <a
                href={`tel:${listing.contact_phone}`}
                className="flex items-center gap-2 text-sm text-teal-600 hover:underline"
              >
                <Phone className="w-4 h-4" />
                {listing.contact_phone}
              </a>
            )}
            {listing.website_url && (
              <a
                href={listing.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-teal-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                Visit website
              </a>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-orange-400 text-white"
              onClick={() => { onClose(); onEnquire(listing); }}
            >
              Send Enquiry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Enquiry Modal ────────────────────────────────────────────────────────────

function EnquiryModal({ listing, open, onClose }) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => API.enquire(listing.id, message),
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Enquiry sent!', description: 'The seller will contact you at your registered email.' });
      setMessage('');
      onClose();
    },
    onError: () => toast({ title: 'Failed to send enquiry', variant: 'destructive' }),
  });

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Send Enquiry</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 -mt-1">{listing.title}</p>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Your Message</label>
            <Textarea
              rows={4}
              placeholder="I am interested in this listing. Please send me more details…"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-orange-400 text-white"
              disabled={!message.trim() || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Listing Modal ─────────────────────────────────────────────────────

function CreateListingModal({ open, onClose, onSuccess }) {
  const { toast } = useToast();
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '', category: '', description: '', price: '',
    currency: 'INR', price_type: 'fixed', condition: '',
    location: '', contact_email: '', contact_phone: '', website_url: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      images.slice(0, 5).forEach(img => fd.append('images', img));
      return API.createListing(fd);
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Listing published!', description: 'Your listing is now live on MedMarket.' });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: 'Failed to publish listing', variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a Listing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Title *</label>
            <Input
              placeholder="e.g. Philips Ultrasound Machine — Model HD7"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Category *</label>
              <Select onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Condition</label>
              <Select onValueChange={v => set('condition', v)}>
                <SelectTrigger><SelectValue placeholder="If applicable" /></SelectTrigger>
                <SelectContent>
                  {['New', 'Like New', 'Good', 'Fair'].map(c => (
                    <SelectItem key={c} value={c.toLowerCase().replace(' ', '-')}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Description *</label>
            <Textarea
              rows={4}
              placeholder="Describe your product, service, or offering in detail…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Pricing</label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Amount"
                type="number"
                value={form.price}
                onChange={e => set('price', e.target.value)}
              />
              <Select defaultValue="INR" onValueChange={v => set('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['INR', 'USD', 'GBP', 'EUR', 'AED'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="fixed" onValueChange={v => set('price_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRICE_TYPES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Images (up to 5)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-teal-400 transition-colors bg-slate-50">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs text-slate-500">
                {images.length > 0 ? `${images.length} file(s) selected` : 'Click to upload images'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => setImages(Array.from(e.target.files).slice(0, 5))}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Location</label>
              <Input
                placeholder="City, State"
                value={form.location}
                onChange={e => set('location', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Contact Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.contact_email}
                onChange={e => set('contact_email', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Contact Phone</label>
              <Input
                placeholder="+91 98765 43210"
                value={form.contact_phone}
                onChange={e => set('contact_phone', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Website URL</label>
              <Input
                placeholder="https://..."
                value={form.website_url}
                onChange={e => set('website_url', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-orange-400 text-white"
              disabled={!form.title || !form.category || !form.description || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'Publishing…' : 'Publish Listing'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MedMarket() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [enquiryTarget, setEnquiryTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('browse'); // browse | mine

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', category, search],
    queryFn: () => API.listListings(category, search),
    enabled: activeTab === 'browse',
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ['myListings'],
    queryFn: API.myListings,
    enabled: activeTab === 'mine',
  });

  const displayList = activeTab === 'browse' ? listings : myListings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400 tracking-widest uppercase">
                  Medical Marketplace
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold leading-tight">
                MedMarket
              </h1>
              <p className="mt-2 text-slate-300 text-sm md:text-base max-w-md">
                Discover equipment, pharmaceuticals, services, and healthcare solutions from trusted medical professionals.
              </p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-amber-500 hover:bg-orange-400 text-white flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              List Your Product
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Active Listings', value: listings.filter(l => l.is_active).length },
              { label: 'Categories', value: [...new Set(listings.map(l => l.category).filter(Boolean))].length },
              { label: 'Featured', value: listings.filter(l => l.is_featured).length },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
          {[
            { key: 'browse', label: 'Browse MedMarket' },
            { key: 'mine',   label: 'My Listings' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 text-sm py-2 rounded-lg transition-colors font-medium ${
                activeTab === t.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors border ${
                      category === cat.value
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search MedMarket…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {activeTab === 'mine' ? 'No listings yet' : 'No listings found'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'mine'
                ? 'Create your first product or service listing'
                : 'Try a different category or search term'}
            </p>
            <Button
              className="mt-4 bg-amber-500 hover:bg-orange-400 text-white"
              onClick={() => setShowCreate(true)}
            >
              Create Listing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onEnquire={setEnquiryTarget}
                onViewDetail={setDetailTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateListingModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => queryClient.invalidateQueries(['listings', 'myListings'])}
      />
      <EnquiryModal
        listing={enquiryTarget}
        open={!!enquiryTarget}
        onClose={() => setEnquiryTarget(null)}
      />
      <ListingDetailModal
        listing={detailTarget}
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        onEnquire={setEnquiryTarget}
      />
    </div>
  );
}