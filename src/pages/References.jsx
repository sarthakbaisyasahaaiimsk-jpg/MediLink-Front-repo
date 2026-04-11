import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as apiClient from '@/api/client';
import { Search, BookOpen, ExternalLink, Bookmark, BookMarked, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

function ReferenceCard({ paper, onSave, saved }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 hover:border-teal-200 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-teal-50 text-teal-700 border-0 text-xs font-medium">
            PubMed
          </Badge>
          {paper.year && (
            <span className="text-xs text-slate-400">{paper.year}</span>
          )}
        </div>
        <button
          onClick={() => onSave(paper)}
          className="text-slate-400 hover:text-teal-500 transition-colors"
          title={saved ? "Saved" : "Save to library"}
        >
          {saved
            ? <BookMarked className="w-4 h-4 text-teal-500" />
            : <Bookmark className="w-4 h-4" />
          }
        </button>
      </div>

      <a
        href={paper.url}
        target="_blank"
        rel="noreferrer"
        className="text-slate-800 font-semibold text-sm leading-snug hover:text-teal-600 transition-colors line-clamp-2"
      >
        {paper.title}
      </a>

      {paper.authors && (
        <p className="text-xs text-slate-400 truncate">{paper.authors}</p>
      )}

      {paper.abstract && (
        <div>
          <p className={`text-sm text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {paper.abstract}
          </p>
          {paper.abstract.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-teal-600 hover:text-teal-700 mt-1 font-medium"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <span className="text-xs text-slate-400">PMID: {paper.pmid}</span>
        <a
          href={paper.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          View on PubMed
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
        <div className="h-4 w-10 bg-slate-100 rounded" />
      </div>
      <div className="h-4 bg-slate-200 rounded w-full mb-2" />
      <div className="h-4 bg-slate-200 rounded w-4/5 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
    </div>
  );
}

const SUGGESTED_QUERIES = [
  "Hypertension management in diabetic patients",
  "Antibiotic resistance latest guidelines",
  "Acute MI treatment protocol 2024",
  "Pediatric fever management",
  "Depression treatment resistant",
];

export default function References() {
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [savedPapers, setSavedPapers] = useState([]);
  const [activeTab, setActiveTab]     = useState('search');
  const [savedPmids, setSavedPmids]   = useState(new Set());

  // ── Pagination state ───────────────────────────────────
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [total, setTotal]         = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Keep a ref to the current query so loadMore always uses the latest value
  const activeQuery = useRef('');

  // ── Zotero state ──────────────────────────────────────
  const [zoteroConnected, setZoteroConnected] = useState(false);
  const [zoteroLoading, setZoteroLoading]     = useState(false);
  const [zoteroMessage, setZoteroMessage]     = useState('');
  const [collections, setCollections]         = useState([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection]   = useState(null);
  const [collectionsLoading, setCollectionsLoading]   = useState(false);

  useEffect(() => {
    async function loadSaved() {
      try {
        const data = await apiClient.references.getSaved();
        setSavedPapers(data.results || []);
        setSavedPmids(new Set((data.results || []).map(p => p.pmid)));
      } catch {
        // not logged in or error — silent fail
      }
    }

    async function checkZotero() {
      try {
        const res = await apiClient.zotero.status();
        setZoteroConnected(res.connected);
      } catch {
        // silent fail
      }
    }

    // Handle redirect back from Zotero OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('zotero') === 'connected') {
      setZoteroConnected(true);
      setZoteroMessage('Zotero connected successfully!');
      window.history.replaceState({}, '', '/references');
      setTimeout(() => setZoteroMessage(''), 4000);
    } else if (params.get('zotero') === 'error') {
      setZoteroMessage('Zotero connection failed. Please try again.');
      window.history.replaceState({}, '', '/references');
      setTimeout(() => setZoteroMessage(''), 4000);
    }

    loadSaved();
    checkZotero();
  }, []);

  // ── Load more (called by IntersectionObserver) ────────
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await apiClient.references.search(activeQuery.current, nextPage, 10);
      setResults(prev => [...prev, ...(data.results || [])]);
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
      setPage(nextPage);
    } catch {
      // silent fail on load-more
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page]);

  // ── IntersectionObserver — watches sentinel div ────────
  useEffect(() => {
    const sentinel = loaderRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  async function handleZoteroExport() {
  setZoteroLoading(true);
  setZoteroMessage('');
  try {
    if (!zoteroConnected) {
      const res = await apiClient.zotero.connect();
      if (res.auth_url) { window.location.href = res.auth_url; return; }
      if (res.connected) setZoteroConnected(true);
    } else {
      // Fetch collections first, then show modal
      setCollectionsLoading(true);
      const res = await apiClient.zotero.collections();
      setCollections(res.collections || []);
      setCollectionsLoading(false);
      setShowCollectionModal(true);
    }
  } catch (err) {
    setZoteroMessage('Zotero error: ' + (err.message || 'Something went wrong'));
    setTimeout(() => setZoteroMessage(''), 5000);
  } finally {
    setZoteroLoading(false);
  }
}

async function handleConfirmExport() {
  setShowCollectionModal(false);
  setZoteroLoading(true);
  try {
    const res = await apiClient.zotero.push({ collection_key: selectedCollection || undefined });
    setZoteroMessage(res.message || 'References pushed to Zotero!');
    setTimeout(() => setZoteroMessage(''), 4000);
  } catch (err) {
    setZoteroMessage('Zotero error: ' + (err.message || 'Something went wrong'));
    setTimeout(() => setZoteroMessage(''), 5000);
  } finally {
    setZoteroLoading(false);
    setSelectedCollection(null);
  }
}

  async function handleZoteroDisconnect() {
    try {
      await apiClient.zotero.disconnect();
      setZoteroConnected(false);
      setZoteroMessage('Zotero disconnected.');
      setTimeout(() => setZoteroMessage(''), 3000);
    } catch {
      // silent fail
    }
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;

    activeQuery.current = query;
    setLoading(true);
    setError('');
    setHasSearched(true);
    setResults([]);
    setPage(1);
    setHasMore(false);
    setTotal(0);

    try {
      const data = await apiClient.references.search(query, 1, 15);
      setResults(data.results || []);
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
    } catch {
      setError('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestedQuery(q) {
    setQuery(q);
    setTimeout(() => {
      document.getElementById('pubmed-search-input')?.focus();
    }, 50);
  }

  async function handleSave(paper) {
    const alreadySaved = savedPmids.has(paper.pmid);
    try {
      if (alreadySaved) {
        await apiClient.references.unsave(paper.pmid);
        setSavedPapers(prev => prev.filter(p => p.pmid !== paper.pmid));
        setSavedPmids(prev => { const s = new Set(prev); s.delete(paper.pmid); return s; });
      } else {
        await apiClient.references.save(paper);
        setSavedPapers(prev => [paper, ...prev]);
        setSavedPmids(prev => new Set([...prev, paper.pmid]));
      }
    } catch {
      // silent fail
    }
  }

  function isSaved(pmid) {
    return savedPmids.has(pmid);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FlaskConical className="w-7 h-7 text-teal-500" />
                References
              </h1>
              <p className="text-slate-500 mt-1">
                Search PubMed and save papers to your library
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'search'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'saved'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Saved
                {savedPapers.length > 0 && (
                  <span className="bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {savedPapers.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {activeTab === 'search' && (
            <form onSubmit={handleSearch} className="flex items-center gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="pubmed-search-input"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search clinical questions, drug names, conditions..."
                  className="pl-10 h-11 text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-teal-500 hover:bg-teal-600 h-11 px-6 gap-2"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Search tab */}
        {activeTab === 'search' && (
          <>
            {!hasSearched && !loading && (
              <div className="mb-8">
                <p className="text-sm text-slate-500 mb-3 font-medium">Suggested searches</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map(q => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedQuery(q)}
                      className="px-3 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 6, 8].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  Showing {results.length} of{' '}
                  <span className="font-medium text-slate-700">{total.toLocaleString()}</span> results for{' '}
                  <span className="font-medium text-slate-700">"{activeQuery.current}"</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map(paper => (
                    <ReferenceCard
                      key={paper.pmid}
                      paper={paper}
                      onSave={handleSave}
                      saved={isSaved(paper.pmid)}
                    />
                  ))}
                </div>

                {/* Sentinel div — IntersectionObserver target */}
                <div ref={loaderRef} className="py-8 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      Loading more results…
                    </div>
                  )}
                  {!hasMore && !loadingMore && (
                    <p className="text-xs text-slate-400">
                      All {total.toLocaleString()} results loaded
                    </p>
                  )}
                </div>
              </>
            )}

            {!loading && hasSearched && results.length === 0 && !error && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No results found</h3>
                <p className="text-slate-500 mt-1">Try different keywords or a broader search term</p>
              </div>
            )}
          </>
        )}

        {/* Saved tab */}
        {activeTab === 'saved' && (
          <>
            {savedPapers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Bookmark className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No saved papers yet</h3>
                <p className="text-slate-500 mt-1">Search for papers and click the bookmark icon to save them here</p>
                <Button
                  className="mt-4 bg-teal-500 hover:bg-teal-600"
                  onClick={() => setActiveTab('search')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Papers
                </Button>
              </div>
            ) : (
              <>
                {/* Zotero toolbar */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <p className="text-sm text-slate-500">
                    {savedPapers.length} saved {savedPapers.length === 1 ? 'paper' : 'papers'}
                  </p>

                  {zoteroMessage && (
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      zoteroMessage.toLowerCase().includes('error') ||
                      zoteroMessage.toLowerCase().includes('failed')
                        ? 'bg-red-50 text-red-600'
                        : 'bg-teal-50 text-teal-700'
                    }`}>
                      {zoteroMessage}
                    </span>
                  )}

                  <Button
                    onClick={handleZoteroExport}
                    disabled={zoteroLoading}
                    variant="outline"
                    className="flex items-center gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
                  >
                    <FlaskConical className="w-4 h-4" />
                    {zoteroLoading
                      ? 'Working…'
                      : zoteroConnected
                        ? 'Export to Zotero'
                        : 'Connect Zotero'
                    }
                  </Button>

                  {zoteroConnected && (
                    <button
                      onClick={handleZoteroDisconnect}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                {/* Paper grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPapers.map(paper => (
                    <ReferenceCard
                      key={paper.pmid}
                      paper={paper}
                      onSave={handleSave}
                      saved={true}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
{showCollectionModal && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
      <h2 className="text-base font-semibold text-slate-800 mb-1">Export to Zotero</h2>
      <p className="text-sm text-slate-500 mb-4">Choose a collection or save to My Library root</p>

      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4">
        <button
          onClick={() => setSelectedCollection(null)}
          className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${
            selectedCollection === null
              ? 'border-teal-400 bg-teal-50 text-teal-700'
              : 'border-slate-100 hover:border-teal-200 text-slate-600'
          }`}
        >
          My Library (root)
        </button>

        {collectionsLoading ? (
          <p className="text-xs text-slate-400 px-3 py-2">Loading collections…</p>
        ) : collections.length === 0 ? (
          <p className="text-xs text-slate-400 px-3 py-2">No collections found</p>
        ) : (
          collections.map(c => (
            <button
              key={c.key}
              onClick={() => setSelectedCollection(c.key)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                selectedCollection === c.key
                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-slate-100 hover:border-teal-200 text-slate-600'
              }`}
            >
              {c.name}
            </button>
          ))
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShowCollectionModal(false)}
          className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <Button
          onClick={handleConfirmExport}
          className="bg-teal-500 hover:bg-teal-600 text-sm"
        >
          Export
        </Button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}