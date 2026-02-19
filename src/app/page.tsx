"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  ExternalLink,
  ChevronRight,
  Loader2,
  Search,
  Brain,
  Database,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import { Lead } from "@/lib/types";

interface GenerateStats {
  total: number;
  inserted: number;
  skipped: number;
  partialMessage?: string;
}

interface ProgressStep {
  step: number;
  total: number;
  message: string;
}

const STORAGE_KEY = "scraper-dashboard-leads";

const STEP_ICONS = [Search, Brain, Database, CheckCircle2];
const STEP_LABELS = [
  "Searching Exa",
  "AI Analysis",
  "Saving to DB",
  "Complete",
];

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GenerateStats | null>(null);
  const [progress, setProgress] = useState<ProgressStep | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeads(parsed);
        }
      }
    } catch {
      // ignore bad data
    }
  }, []);

  useEffect(() => {
    if (leads.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }
  }, [leads]);

  function handleClearLeads() {
    setLeads([]);
    setStats(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function handleGenerateLeads() {
    setLoading(true);
    setError(null);
    setStats(null);
    setProgress({ step: 0, total: 4, message: "Starting..." });

    try {
      const stored = localStorage.getItem("scraper-settings");
      const settings = stored ? JSON.parse(stored) : {};

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exaApiKey: settings.exaApiKey || undefined,
          geminiApiKey: settings.geminiApiKey || undefined,
          referenceUrls: settings.referenceUrls?.length
            ? settings.referenceUrls
            : undefined,
          supabaseUrl: settings.supabaseUrl || undefined,
          supabaseAnonKey: settings.supabaseAnonKey || undefined,
          maxResults: settings.maxResults || 10,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const cleaned = line.replace(/^data: /, "").trim();
          if (!cleaned) continue;

          try {
            const event = JSON.parse(cleaned);

            if (event.type === "progress") {
              setProgress({
                step: event.step,
                total: event.total,
                message: event.message,
              });
            } else if (event.type === "result") {
              setLeads(event.leads);
              if (event.stats) setStats(event.stats);
              if (event.partial && event.message) {
                setStats(prev => prev ? { ...prev, partialMessage: event.message } : null);
              }
            } else if (event.type === "error") {
              setError(event.message);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(null), 2000);
    }
  }

  const uniqueSignals = new Set(leads.map((l) => l.signalType)).size;
  const uniqueCities = new Set(leads.map((l) => l.city)).size;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Discover and track high-intent leads
            </p>
          </div>
          <div className="flex items-center gap-3">
            {leads.length > 0 && !loading && (
              <button
                onClick={handleClearLeads}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors border border-gray-700"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
            <button
              onClick={handleGenerateLeads}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {loading ? "Generating..." : "Generate Leads"}
            </button>
          </div>
        </header>

        {/* Live Progress Tracker */}
        {loading && progress && (
          <div className="mx-8 mt-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              {STEP_LABELS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = progress.step === stepNum;
                const isComplete = progress.step > stepNum;
                const Icon = STEP_ICONS[i];
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isComplete
                          ? "bg-green-500/20 text-green-400"
                          : isActive
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-gray-800 text-gray-600"
                      }`}
                    >
                      {isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        isComplete
                          ? "text-green-400"
                          : isActive
                          ? "text-indigo-300"
                          : "text-gray-600"
                      }`}
                    >
                      {label}
                    </span>
                    {i < STEP_LABELS.length - 1 && (
                      <div
                        className={`flex-1 h-px ${
                          isComplete ? "bg-green-500/30" : "bg-gray-800"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(progress.step / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{progress.message}</p>
          </div>
        )}

        {error && (
          <div className="mx-8 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {stats && !loading && (
          <div className="mx-8 mt-4 space-y-2">
            <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-300">
              {stats.total} leads found — {stats.inserted} new saved, {stats.skipped} duplicates skipped
            </div>
            {stats.partialMessage && (
              <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
                {stats.partialMessage}
              </div>
            )}
          </div>
        )}

        <div className="px-8 py-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Leads", value: String(leads.length), sub: "This session" },
            { label: "Signal Types", value: String(uniqueSignals), sub: "Unique signals" },
            { label: "Cities", value: String(uniqueCities), sub: "Covered regions" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
            >
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold text-white mt-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 px-8 pb-8 overflow-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Recent Leads
              </h3>
              <span className="text-xs text-gray-500">
                {leads.length} results
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Signal Type</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading && !leads.length &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-gray-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  {!loading && leads.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-gray-500"
                      >
                        No leads yet. Click &quot;Generate Leads&quot; to
                        get started.
                      </td>
                    </tr>
                  )}
                  {leads.map((lead, i) => (
                    <tr
                      key={`${lead.name}-${i}`}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-medium text-white whitespace-nowrap">
                        {lead.name}
                      </td>
                      <td className="px-5 py-4 text-gray-300 whitespace-nowrap">
                        {lead.company}
                      </td>
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                        {lead.city}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <ChevronRight className="w-3 h-3" />
                          {lead.signalType}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <a
                          href={lead.sourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        <p className="leading-relaxed">
                          {lead.explanation}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
