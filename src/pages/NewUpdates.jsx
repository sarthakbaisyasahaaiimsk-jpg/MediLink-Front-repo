import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Rss, ExternalLink, RefreshCw, AlertCircle, Clock, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as apiClient from '@/api/client';

const SOURCE_META = {
  WHO:          { color: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500'   },
  CDC:          { color: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500'    },
  NIH:          { color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  NICE:         { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  MOHFW:        { color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  ICMR:         { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  'HINDU HEALTH': { color: 'bg-rose-50 text-rose-700 border-rose-200',    dot: 'bg-rose-500'   },
  OTHER:        { color: 'bg-slate-50 text-slate-600 border-slate-200',    dot: 'bg-slate-400'  },
};



function sourceMeta(source) {
  const key = (source || '').toUpperCase();
  return SOURCE_META[key] || SOURCE_META.OTHER;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ArticleSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-12 bg-slate-200 rounded-full" />
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </div>
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-full mb-1" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

function ArticleCard({ article }) {
  const meta = sourceMeta(article.source);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-2xl p-5 border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {article.source}
          </span>
          {article.published_at && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {timeAgo(article.published_at)}
            </span>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors shrink-0 mt-0.5" />
      </div>

      <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">
        {article.title}
      </h3>

      {article.summary && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
          {article.summary}
        </p>
      )}
    </a>
  );
}

const SOURCES = ['All', 'WHO', 'CDC', 'NIH', 'NICE', 'MOHFW', 'ICMR', 'Hindu Health'];

export default function NewUpdates() {
  const [search, setSearch]       = useState('');
  const [source, setSource]       = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['news', source],
    queryFn: () =>
      apiClient.news.list(source !== 'All' ? { source } : {}),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger backend to re-fetch RSS feeds and store new articles
      await apiClient.default.news?.refresh?.() ??
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://medilink-back-repo-1.onrender.com'}/api/news/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
      // Invalidate cache so fresh articles load
      await queryClient.invalidateQueries({ queryKey: ['news'] });
      await refetch();
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = data.filter(a =>
    !search ||
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.summary?.toLowerCase().includes(search.toLowerCase())
  );

  const isBusy = isFetching || refreshing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Rss className="w-7 h-7 text-teal-500" />
                Medical Updates
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Live feeds from WHO, CDC, NIH, and NICE
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search updates..."
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isBusy}
                title="Refresh feeds"
              >
                <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin text-teal-500' : 'text-slate-500'}`} />
              </Button>
            </div>
          </div>

          {/* Source tabs */}
          <div className="mt-4">
            <Tabs value={source} onValueChange={setSource}>
              <TabsList className="bg-slate-100">
                {SOURCES.map(s => (
                  <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Empty DB hint */}
        {!isLoading && !isError && data.length === 0 && !search && (
          <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-6 text-sm text-teal-700">
            <Rss className="w-5 h-5 shrink-0" />
            <span>No articles yet. Click the refresh button above to fetch the latest feeds from WHO, CDC, NIH, and NICE.</span>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Could not load updates. Make sure the backend is running.</span>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Count badge */}
        {!isLoading && !isError && data.length > 0 && (
          <div className="flex items-center gap-2 mb-5 text-sm text-slate-500">
            <Globe className="w-4 h-4" />
            <span>
              {filtered.length} article{filtered.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </span>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 && search ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No results</h3>
            <p className="text-slate-500 mt-1 text-sm">Try a different search term.</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}