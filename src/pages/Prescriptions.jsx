import { useState } from "react";
import axios from "axios";

const QUICK_SEARCHES = ["Tuberculosis", "Hypertension", "Type 2 Diabetes", "Malaria", "Typhoid"];

export default function Prescriptions() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("meds");

  const search = async (name) => {
    const term = name || query;
    if (!term.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await axios.get(`/api/prescriptions/search?disease=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setData(res.data);
      setActiveTab("meds");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Prescription Guidelines</h1>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search disease… e.g. Tuberculosis"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
        />
        <button
          onClick={() => search()}
          className="px-5 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          Search
        </button>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_SEARCHES.map(d => (
          <button
            key={d}
            onClick={() => { setQuery(d); search(d); }}
            className="text-xs px-3 py-1 rounded-full border hover:bg-gray-50 text-gray-500"
          >
            {d}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Fetching guideline…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!data && !loading && !error && (
        <p className="text-center text-gray-400 text-sm mt-16">
          Search a disease name to view standard prescription guidelines.
        </p>
      )}

      {/* Result card */}
      {data && (
        <div className="border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-medium">{data.disease}</h2>
              <p className="text-sm text-gray-400">ICD: {data.icd_code} · Updated {data.last_updated}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">
              {data.source}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-6">
            {[["meds", "Medications"], ["ci", "Contraindications"], ["pg", "Patient Groups"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-2 px-4 text-sm border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-gray-800 text-gray-900 font-medium"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-6 py-4">
            {activeTab === "meds" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase">
                    <th className="text-left pb-2 font-medium">Drug</th>
                    <th className="text-left pb-2 font-medium">Dose</th>
                    <th className="text-left pb-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.medications?.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 font-medium text-gray-800">{m.drug}</td>
                      <td className="py-2 text-gray-500">{m.dose}</td>
                      <td className="py-2 text-gray-500">{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "ci" && (
              <ul className="space-y-2">
                {data.contraindications?.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 border-b pb-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            )}

            {activeTab === "pg" && (
              <div className="grid grid-cols-2 gap-3">
                {data.patient_groups?.map((pg, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-800 mb-1">{pg.name}</p>
                    <p className="text-xs text-gray-500">{pg.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}