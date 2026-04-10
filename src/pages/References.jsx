import React, { useState } from 'react';
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

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const data = await apiClient.references.search(query);
      setResults(data.results || []);
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

  function handleSave(paper) {
    setSavedPapers(prev => {
      const exists = prev.find(p => p.pmid === paper.pmid);
      if (exists) return prev.filter(p => p.pmid !== paper.pmid);
      return [paper, ...prev];
    });
  }

  function isSaved(pmid) {
    return savedPapers.some(p => p.pmid === pmid);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">

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

      <div className="max-w-7xl mx-auto px-4 py-8">

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
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  {results.length} results for <span className="font-medium text-slate-700">"{query}"</span>
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
                <p className="text-sm text-slate-500 mb-4">
                  {savedPapers.length} saved {savedPapers.length === 1 ? 'paper' : 'papers'}
                </p>
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

      </div>
    </div>
  );
}