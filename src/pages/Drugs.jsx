import React, { useState, useRef, useCallback } from 'react';
import { Search, Pill, ChevronDown, ChevronUp, AlertTriangle, Zap, FlaskConical, Shield, BookOpen, Thermometer, X, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as apiClient from '@/api/client';
import Layout from "@/Layout";

// ── Bullet list renderer ──────────────────────────────────
// Backend sends pre-parsed arrays — no client-side parsing needed.
function BulletList({ bullets, color = "teal" }) {
  const dotColor = {
    teal:   "bg-teal-400",
    amber:  "bg-amber-400",
    red:    "bg-red-400",
    blue:   "bg-blue-400",
    purple: "bg-purple-400",
    slate:  "bg-slate-400",
  }[color] || "bg-teal-400";

  // Accept both arrays (new backend) and strings (fallback)
  const items = Array.isArray(bullets)
    ? bullets
    : typeof bullets === "string" && bullets.trim()
    ? [bullets]
    : [];

  if (items.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {items.map((b, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={`mt-[6px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-sm text-slate-700 leading-relaxed">{b}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Section component ─────────────────────────────────────
function Section({ icon: Icon, title, content, color = "teal", defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content) return null;

  // content is an array from the backend
  const bullets = Array.isArray(content)
    ? content
    : typeof content === "string" && content.trim()
    ? [content]
    : [];

  if (bullets.length === 0) return null;

  const colorMap = {
    teal:   "bg-teal-50 text-teal-700 border-teal-100",
    amber:  "bg-amber-50 text-amber-700 border-amber-100",
    red:    "bg-red-50 text-red-700 border-red-100",
    blue:   "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    slate:  "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className={`rounded-xl border ${colorMap[color]} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs opacity-60 font-normal">
            ({bullets.length} {bullets.length === 1 ? "point" : "points"})
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 opacity-50" />
          : <ChevronDown className="w-4 h-4 opacity-50" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-current border-opacity-10">
          <BulletList bullets={bullets} color={color} />
        </div>
      )}
    </div>
  );
}

// ── Interaction badge ─────────────────────────────────────
function InteractionCard({ interaction }) {
  const sev = (interaction.severity || "").toLowerCase();
  const color = sev.includes("high")
    ? "bg-red-50 border-red-200 text-red-700"
    : sev.includes("moderate")
    ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-slate-50 border-slate-200 text-slate-700";

  return (
    <div className={`rounded-lg border p-3 text-xs ${color}`}>
      {interaction.drugs?.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-1">
          {interaction.drugs.map((d, i) => (
            <span key={i} className="font-medium">
              {d}{i < interaction.drugs.length - 1 ? ' + ' : ''}
            </span>
          ))}
        </div>
      )}
      <p className="leading-relaxed">{interaction.description}</p>
      {interaction.severity && (
        <span className="inline-block mt-1 font-medium opacity-70">{interaction.severity}</span>
      )}
    </div>
  );
}

// ── Source badges ─────────────────────────────────────────
// Shows which data sources contributed to this drug's information.
function SourceBadges({ sources }) {
  if (!sources || sources.length === 0) return null;
  const colorMap = {
    OpenFDA:  "bg-teal-50 text-teal-700 border-teal-100",
    DailyMed: "bg-blue-50 text-blue-700 border-blue-100",
    ChEMBL:   "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Database className="w-3 h-3 text-slate-400" />
      {sources.map((s) => (
        <span
          key={s}
          className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[s] || "bg-slate-50 text-slate-600 border-slate-100"}`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

// ── No-data notice ────────────────────────────────────────
// Shown when all three sources returned nothing for a drug.
// Helps the user understand it's a data gap, not a bug.
function NoDataNotice({ name }) {
  return (
    <div className="mx-4 mt-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-amber-700 mb-1">Limited Data Available</p>
        <p className="text-xs text-amber-600 leading-relaxed">
          No detailed label information was found for <strong>{name}</strong> in OpenFDA,
          DailyMed, or ChEMBL at this time. This may be because the drug is not yet
          approved in the US, uses a different name in these databases, or data is
          temporarily unavailable. Try searching by the generic (INN) name.
        </p>
      </div>
    </div>
  );
}

// ── Drug detail panel ─────────────────────────────────────
function DrugDetail({ drug, onClose }) {
  if (!drug) return null;

  const displayName = drug.brand_name || drug.generic_name || drug.name || "Unknown Drug";
  const genericName = drug.generic_name && drug.generic_name !== displayName ? drug.generic_name : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            {genericName && <p className="text-teal-100 text-sm mt-0.5">{genericName}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              {drug.route && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{drug.route}</span>
              )}
              {drug.dosage_form && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{drug.dosage_form}</span>
              )}
              {drug.product_type && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{drug.product_type}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        {drug.manufacturer && (
          <p className="text-teal-100 text-xs mt-3">Manufacturer: {drug.manufacturer}</p>
        )}
        {/* Source badges in header */}
        {drug._sources?.length > 0 && (
          <div className="mt-3">
            <SourceBadges sources={drug._sources} />
          </div>
        )}
      </div>

      {/* No data notice */}
      {drug.no_data && <NoDataNotice name={drug.generic_name || drug.name || "this drug"} />}

      {/* Boxed warning */}
      {drug.warnings_boxed && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700 mb-1">⚠ Boxed Warning</p>
            <BulletList bullets={drug.warnings_boxed} color="red" />
          </div>
        </div>
      )}

      {/* Top adverse events chart */}
      {drug.top_adverse_events?.length > 0 && (
        <div className="mx-4 mt-4">
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
            Top Reported Adverse Events
          </p>
          <div className="flex flex-col gap-1">
            {drug.top_adverse_events.slice(0, 8).map((ae, i) => {
              const max = drug.top_adverse_events[0].count;
              const pct = Math.round((ae.count / max) * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-40 truncate">{ae.term}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-teal-400 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    {ae.count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="p-4 flex flex-col gap-3">
        <Section icon={Pill}          title="Indications & Usage"        content={drug.indications}             color="teal"   defaultOpen={true} />
        <Section icon={BookOpen}      title="Dosage & Administration"    content={drug.dosage_administration}   color="blue" />
        <Section icon={Zap}           title="Mechanism of Action"        content={drug.mechanism}               color="purple" />
        <Section icon={FlaskConical}  title="Pharmacodynamics"           content={drug.pharmacodynamics}        color="purple" />
        <Section icon={FlaskConical}  title="Clinical Pharmacology"      content={drug.pharmacokinetics}        color="purple" />
        <Section icon={AlertTriangle} title="Warnings & Precautions"     content={drug.warnings}               color="amber" />
        <Section icon={Shield}        title="Contraindications"          content={drug.contraindications}       color="red" />
        <Section icon={Thermometer}   title="Adverse Reactions"          content={drug.adverse_reactions}       color="amber" />
        <Section icon={AlertTriangle} title="Drug Interactions"          content={drug.drug_interactions}       color="amber" />
        <Section icon={AlertTriangle} title="Overdosage"                 content={drug.overdosage}             color="red" />
        <Section icon={Shield}        title="Pregnancy"                  content={drug.pregnancy}               color="blue" />
        <Section icon={Shield}        title="Pediatric Use"              content={drug.pediatric_use}           color="blue" />
        <Section icon={Shield}        title="Geriatric Use"              content={drug.geriatric_use}           color="blue" />
        <Section icon={BookOpen}      title="Storage & Handling"         content={drug.storage}                 color="slate" />

        {/* RxNorm interactions */}
        {drug.rxnorm_interactions?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Drug-Drug Interactions ({drug.rxnorm_interactions.length})
            </p>
            <div className="flex flex-col gap-2">
              {drug.rxnorm_interactions.map((ix, idx) => (
                <InteractionCard key={idx} interaction={ix} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Data sourced from OpenFDA, DailyMed, and RxNorm (US National Library of Medicine) and ChEMBL (EMBL-EBI).
          For clinical decisions, always verify with current prescribing information.
        </p>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────
function SkeletonResult() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function Drugs() {
  const [query, setQuery]                 = useState('');
  const [results, setResults]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDrug, setSelectedDrug]   = useState(null);
  const [error, setError]                 = useState('');
  const [hasSearched, setHasSearched]     = useState(false);
  const debounceRef                       = useRef(null);

  const COMMON_DRUGS = [
    "Paracetamol", "Amoxicillin", "Metformin", "Atorvastatin",
    "Omeprazole", "Amlodipine", "Azithromycin", "Ibuprofen",
    "Methotrexate", "Warfarin",
  ];

  const searchDrugs = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const data = await apiClient.drugs.search(q);
      setResults(data.results || []);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchDrugs(val), 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    searchDrugs(query);
  };

  const handleSelectDrug = async (drug) => {
    setDetailLoading(true);
    setSelectedDrug(null);
    try {
      const detail = await apiClient.drugs.detail(drug.name, drug.rxcui);
      setSelectedDrug({ ...drug, ...detail });
    } catch {
      // Even on error, show what we have from the search result
      setSelectedDrug(drug);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Layout currentPageName="Drugs">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">

        {/* Header */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Pill className="w-7 h-7 text-teal-500" />
                  Drug Database
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                  Search drug information from OpenFDA, DailyMed, RxNorm & ChEMBL
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full border border-teal-100">OpenFDA</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">RxNorm</span>
                <span className="text-xs bg-sky-50 text-sky-700 px-3 py-1 rounded-full border border-sky-100">DailyMed</span>
                <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">ChEMBL</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={handleInput}
                  placeholder="Search by drug name, generic, or brand..."
                  className="pl-10 h-11 text-sm"
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-teal-500 hover:bg-teal-600 h-11 px-6"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </form>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-7xl mx-auto px-4 py-8">

          {!hasSearched && (
            <div className="mb-8">
              <p className="text-sm text-slate-500 mb-3 font-medium">Common searches</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_DRUGS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setQuery(d); searchDrugs(d); }}
                    className="px-3 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
                  >
                    {d}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Results list */}
            <div className="md:col-span-1">
              {loading && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((i) => <SkeletonResult key={i} />)}
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-400 mb-1">{results.length} results</p>
                  {results.map((drug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectDrug(drug)}
                      className={`text-left bg-white rounded-xl border p-4 transition-all hover:border-teal-300 hover:shadow-sm ${
                        selectedDrug?.rxcui === drug.rxcui && selectedDrug?.name === drug.name
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-slate-100'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800 leading-snug">{drug.name}</p>
                      <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                        drug.type === 'Brand'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-teal-50 text-teal-700'
                      }`}>
                        {drug.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!loading && hasSearched && results.length === 0 && !error && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Pill className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium text-sm">No results found</p>
                  <p className="text-slate-400 text-xs mt-1">Try a generic (INN) name or active ingredient</p>
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="md:col-span-2">
              {detailLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading drug information…</span>
                    <span className="text-xs text-slate-300">Fetching from OpenFDA, DailyMed & ChEMBL in parallel</span>
                  </div>
                </div>
              )}

              {!detailLoading && selectedDrug && (
                <DrugDetail drug={selectedDrug} onClose={() => setSelectedDrug(null)} />
              )}

              {!detailLoading && !selectedDrug && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                    <Pill className="w-8 h-8 text-teal-400" />
                  </div>
                  <p className="text-slate-600 font-medium">Select a drug to view details</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Search above and click any result to see full drug information
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}