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
          <Badge className="bg-teal-50 text-teal-700 border-0 text-xs font-medium">PubMed</Badge>
          {paper.year && <span className="text-xs text-slate-400">{paper.year}</span>}
        </div>
        <button onClick={() => onSave(paper)} className="text-slate-400 hover:text-teal-500 transition-colors" title={saved ? "Saved" : "Save to library"}>
          {saved ? <BookMarked className="w-4 h-4 text-teal-500" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
      <a href={paper.url} target="_blank" rel="noreferrer" className="text-slate-800 font-semibold text-sm leading-snug hover:text-teal-600 transition-colors line-clamp-2">
        {paper.title}
      </a>
      {paper.authors && <p className="text-xs text-slate-400 truncate">{paper.authors}</p>}
      {paper.abstract && (
        <div>
          <p className={`text-sm text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>{paper.abstract}</p>
          {paper.abstract.length > 200 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-teal-600 hover:text-teal-700 mt-1 font-medium">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <span className="text-xs text-slate-400">PMID: {paper.pmid}</span>
        <a href={paper.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
          View on PubMed <ExternalLink className="w-3 h-3" />
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

const PUBMED_FIELDS = {
  "All Fields": "",
  Title: "[Title]",
  "Title/Abstract": "[Title/Abstract]",
  Author: "[Author]",
  Journal: "[Journal]",
  "MeSH Terms": "[MeSH Terms]",
};

function formatPubMedTerm(rawTerm, field) {
  const term = rawTerm.trim();
  if (!term) return "";
  const quoted = /\s/.test(term) && !(term.startsWith('"') && term.endsWith('"'))
    ? `"${term.replace(/"/g, '\\"')}"`
    : term;
  return `${quoted}${PUBMED_FIELDS[field] || ""}`;
}

function buildAdvancedQuery(rows, dateFrom, dateTo) {
  const validRows = rows
    .map((row) => ({ ...row, term: row.term.trim() }))
    .filter((row) => row.term);

  let query = "";
  validRows.forEach((row, index) => {
    const formatted = formatPubMedTerm(row.term, row.field);
    if (!formatted) return;
    if (index === 0) query = formatted;
    else query += ` ${row.operator || "AND"} ${formatted}`;
  });

  if (dateFrom || dateTo) {
    const from = dateFrom ? `${dateFrom}/01/01` : "1800/01/01";
    const to = dateTo ? `${dateTo}/12/31` : "3000/12/31";
    const dateClause = `("${from}"[Date - Publication] : "${to}"[Date - Publication])`;
    query = query ? `(${query}) AND ${dateClause}` : dateClause;
  }
  return query;
}

export default function References() {
  const [query, setQuery] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedRows, setAdvancedRows] = useState([
    { field: "Title/Abstract", term: "", operator: "AND" },
    { field: "Title/Abstract", term: "", operator: "AND" },
  ]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("relevance");
  const [activeSort, setActiveSort] = useState("relevance");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [savedPapers, setSavedPapers] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [savedPmids, setSavedPmids] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef(null);
  const activeQuery = useRef('');
  const [zoteroConnected, setZoteroConnected] = useState(false);
  const [zoteroLoading, setZoteroLoading] = useState(false);
  const [zoteroMessage, setZoteroMessage] = useState('');
  const [collections, setCollections] = useState([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

  useEffect(() => {
    async function loadSaved() {
      try {
        const data = await apiClient.references.getSaved();
        setSavedPapers(data.results || []);
        setSavedPmids(new Set((data.results || []).map(p => p.pmid)));
      } catch {
        // Silent fail if the user is not logged in or the service is unavailable.
      }
    }

    async function checkZotero() {
      try {
        const res = await apiClient.zotero.status();
        setZoteroConnected(res.connected);
      } catch {
        // Silent fail.
      }
    }

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

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await apiClient.references.search(activeQuery.current, nextPage, 15, activeSort);
      setResults(prev => [...prev, ...(data.results || [])]);
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
      setPage(nextPage);
    } catch {
      // Keep current results if loading more fails.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, activeSort]);

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
        if (res.auth_url) {
          window.location.href = res.auth_url;
          return;
        }
        if (res.connected) setZoteroConnected(true);
      } else {
        setCollectionsLoading(true);
        const res = await apiClient.zotero.collections();
        setCollections(res.collections || []);
        setCollectionsLoading(false);
        setShowCollectionModal(true);
      }
    } catch (err) {
      setZoteroMessage(err.message || 'Unable to connect to Zotero.');
    } finally {
      setZoteroLoading(false);
      setCollectionsLoading(false);
    }
  }

  async function handleCreateCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    setCreatingCollection(true);
    try {
      const res = await apiClient.zotero.createCollection(name);
      const created = res.collection || res;
      setCollections(prev => [...prev, created]);
      setSelectedCollection(created.key || null);
      setNewCollectionName('');
      setShowNewCollectionInput(false);
      setZoteroMessage('Collection created successfully.');
    } catch (err) {
      setZoteroMessage(err.message || 'Unable to create collection.');
    } finally {
      setCreatingCollection(false);
    }
  }

  async function handleConfirmExport() {
    setZoteroLoading(true);
    setZoteroMessage('');
    try {
      const pmids = savedPapers.map(p => p.pmid);
      const res = await apiClient.zotero.push({
        pmids,
        collection_key: selectedCollection,
      });
      setZoteroMessage(res.message || 'References exported to Zotero.');
      setShowCollectionModal(false);
    } catch (err) {
      setZoteroMessage(err.message || 'Export to Zotero failed.');
    } finally {
      setZoteroLoading(false);
    }
  }

  async function handleZoteroDisconnect() {
    try {
      await apiClient.zotero.disconnect();
      setZoteroConnected(false);
      setZoteroMessage('Zotero disconnected.');
    } catch (err) {
      setZoteroMessage(err.message || 'Unable to disconnect Zotero.');
    }
  }

  function isSaved(pmid) {
    return savedPmids.has(pmid);
  }

  async function handleSave(paper) {
    try {
      if (isSaved(paper.pmid)) {
        await apiClient.references.unsave(paper.pmid);
        setSavedPapers(prev => prev.filter(p => p.pmid !== paper.pmid));
        setSavedPmids(prev => {
          const next = new Set(prev);
          next.delete(paper.pmid);
          return next;
        });
      } else {
        await apiClient.references.save(paper);
        setSavedPapers(prev => [paper, ...prev.filter(p => p.pmid !== paper.pmid)]);
        setSavedPmids(prev => new Set([...prev, paper.pmid]));
      }
    } catch (err) {
      setError(err.message || 'Unable to update saved references.');
    }
  }

  function updateAdvancedRow(index, key, value) {
    setAdvancedRows(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }

  function addAdvancedRow() {
    setAdvancedRows(prev => [...prev, { field: "Title/Abstract", term: "", operator: "AND" }]);
  }

  function removeAdvancedRow(index) {
    setAdvancedRows(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSearch(e) {
    if (e) e.preventDefault();
    setError('');

    const finalQuery = advancedOpen
      ? buildAdvancedQuery(advancedRows, dateFrom, dateTo)
      : query.trim();

    if (!finalQuery) {
      setError('Enter a search term or add a term in advanced search.');
      return;
    }
    if (dateFrom && dateTo && Number(dateFrom) > Number(dateTo)) {
      setError('The starting year must be less than or equal to the ending year.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setResults([]);
    setPage(1);
    setHasMore(false);
    setTotal(0);
    activeQuery.current = finalQuery;
    setActiveSort(sort);

    try {
      const data = await apiClient.references.search(finalQuery, 1, 15, sort);
      setResults(data.results || []);
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
      setPage(1);
    } catch (err) {
      setError(err.message || 'Unable to search PubMed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestedQuery(suggested) {
    setQuery(suggested);
    setAdvancedOpen(false);
    setError('');
    setTimeout(() => {
      const form = document.getElementById('reference-search-form');
      if (form) form.requestSubmit();
    }, 0);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Medical References</h1>
            <p className="text-sm text-slate-500 mt-1">Search PubMed for medical research and clinical evidence.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('search')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'search' ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'}`}>
              <Search className="w-4 h-4 inline mr-2" />Search
            </button>
            <button onClick={() => setActiveTab('saved')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'saved' ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'}`}>
              <Bookmark className="w-4 h-4 inline mr-2" />Saved ({savedPapers.length})
            </button>
          </div>
        </div>

        {activeTab === 'search' && (
          <>
            <form id="reference-search-form" onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search medical literature..." className="pl-10 h-11" />
                </div>
                <Button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600 h-11 px-6">
                  {loading ? 'Searching…' : 'Search PubMed'}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <button type="button" onClick={() => setAdvancedOpen(prev => !prev)} className="text-sm font-medium text-teal-600 hover:text-teal-700">
                  {advancedOpen ? '− Hide advanced search' : '+ Advanced search'}
                </button>
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  Sort by
                  <select value={sort} onChange={e => setSort(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white">
                    <option value="relevance">Relevance</option>
                    <option value="pub_date">Most recent</option>
                  </select>
                </label>
              </div>

              {advancedOpen && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Build your PubMed query</p>
                  <div className="space-y-3">
                    {advancedRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_110px_36px] gap-2 items-center">
                        <select value={row.field} onChange={e => updateAdvancedRow(index, 'field', e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                          {Object.keys(PUBMED_FIELDS).map(field => <option key={field} value={field}>{field}</option>)}
                        </select>
                        <Input value={row.term} onChange={e => updateAdvancedRow(index, 'term', e.target.value)} placeholder="Enter keyword or phrase" />
                        <select value={row.operator} onChange={e => updateAdvancedRow(index, 'operator', e.target.value)} disabled={index === 0} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-40">
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                          <option value="NOT">NOT</option>
                        </select>
                        <button type="button" onClick={() => removeAdvancedRow(index)} disabled={advancedRows.length <= 1} className="text-slate-400 hover:text-red-500 disabled:opacity-30 text-xl" aria-label="Remove search term">×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addAdvancedRow} className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium">+ Add search term</button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                    <label className="text-sm text-slate-600">
                      From publication year
                      <Input type="number" min="1800" max="3000" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="e.g. 2020" className="mt-1" />
                    </label>
                    <label className="text-sm text-slate-600">
                      To publication year
                      <Input type="number" min="1800" max="3000" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="e.g. 2025" className="mt-1" />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Advanced terms are sent to PubMed using its search syntax. Results may differ from the PubMed website because search translation and ranking can vary.</p>
                </div>
              )}
            </form>

            {!hasSearched && (
              <div className="mb-8">
                <p className="text-sm text-slate-500 mb-3">Suggested searches</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map(suggested => (
                    <button key={suggested} onClick={() => handleSuggestedQuery(suggested)} className="text-sm px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors">
                      {suggested}
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
                  Showing {results.length} of <span className="font-medium text-slate-700">{total.toLocaleString()}</span> results for <span className="font-medium text-slate-700">"{activeQuery.current}"</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map(paper => (
                    <ReferenceCard key={paper.pmid} paper={paper} onSave={handleSave} saved={isSaved(paper.pmid)} />
                  ))}
                </div>
                <div ref={loaderRef} className="py-8 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      Loading more results…
                    </div>
                  )}
                  {!hasMore && !loadingMore && <p className="text-xs text-slate-400">All {total.toLocaleString()} results loaded</p>}
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

        {activeTab === 'saved' && (
          <>
            {savedPapers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Bookmark className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No saved papers yet</h3>
                <p className="text-slate-500 mt-1">Search for papers and click the bookmark icon to save them here</p>
                <Button className="mt-4 bg-teal-500 hover:bg-teal-600" onClick={() => setActiveTab('search')}>
                  <Search className="w-4 h-4 mr-2" />Search Papers
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <p className="text-sm text-slate-500">{savedPapers.length} saved {savedPapers.length === 1 ? 'paper' : 'papers'}</p>
                  {zoteroMessage && (
                    <span className={`text-xs px-3 py-1 rounded-full ${zoteroMessage.toLowerCase().includes('error') || zoteroMessage.toLowerCase().includes('failed') ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700'}`}>
                      {zoteroMessage}
                    </span>
                  )}
                  <Button onClick={handleZoteroExport} disabled={zoteroLoading} variant="outline" className="flex items-center gap-2 border-teal-200 text-teal-700 hover:bg-teal-50">
                    <FlaskConical className="w-4 h-4" />
                    {zoteroLoading ? 'Working…' : zoteroConnected ? 'Export to Zotero' : 'Connect Zotero'}
                  </Button>
                  {zoteroConnected && (
                    <button onClick={handleZoteroDisconnect} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Disconnect</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPapers.map(paper => (
                    <ReferenceCard key={paper.pmid} paper={paper} onSave={handleSave} saved={true} />
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
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-3">
                <button onClick={() => setSelectedCollection(null)} className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${selectedCollection === null ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-100 hover:border-teal-200 text-slate-600'}`}>
                  My Library (root)
                </button>
                {collectionsLoading ? (
                  <p className="text-xs text-slate-400 px-3 py-2">Loading collections…</p>
                ) : collections.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-2">No collections found</p>
                ) : (
                  collections.map(c => (
                    <button key={c.key} onClick={() => setSelectedCollection(c.key)} className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${selectedCollection === c.key ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-100 hover:border-teal-200 text-slate-600'}`}>
                      {c.name}
                    </button>
                  ))
                )}
              </div>
              {showNewCollectionInput ? (
                <div className="flex gap-2 mb-3">
                  <input autoFocus type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateCollection()} placeholder="Collection name..." className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-400" />
                  <Button onClick={handleCreateCollection} disabled={creatingCollection || !newCollectionName.trim()} className="bg-teal-500 hover:bg-teal-600 text-sm px-3">
                    {creatingCollection ? '…' : 'Create'}
                  </Button>
                  <button onClick={() => { setShowNewCollectionInput(false); setNewCollectionName(''); }} className="text-xs text-slate-400 hover:text-slate-600 px-1">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowNewCollectionInput(true)} className="w-full text-left px-3 py-2 rounded-lg text-sm border border-dashed border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-600 transition-all mb-3">
                  + New collection
                </button>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowCollectionModal(false); setShowNewCollectionInput(false); setNewCollectionName(''); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <Button onClick={handleConfirmExport} className="bg-teal-500 hover:bg-teal-600 text-sm">Export</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}