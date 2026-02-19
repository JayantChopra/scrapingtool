"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Mail,
  ExternalLink,
  ChevronRight,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import { Lead, LeadList } from "@/lib/types";
import { exportLeadsToCSV } from "@/lib/csv";

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [list, setList] = useState<LeadList | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [deletingList, setDeletingList] = useState(false);

  useEffect(() => {
    async function fetchListDetail() {
      try {
        const stored = localStorage.getItem("scraper-settings");
        const settings = stored ? JSON.parse(stored) : {};
        const qp = new URLSearchParams();
        if (settings.supabaseUrl) qp.set("supabaseUrl", settings.supabaseUrl);
        if (settings.supabaseAnonKey) qp.set("supabaseAnonKey", settings.supabaseAnonKey);

        const res = await fetch(`/api/lists/${id}?${qp.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${res.status})`);
        }
        const data = await res.json();
        setList(data.list);
        setLeads(
          (data.leads || []).map((l: Record<string, string>) => ({
            id: l.id,
            name: l.name,
            company: l.company,
            city: l.city,
            signalType: l.signal_type,
            sourceLink: l.source_link,
            explanation: l.explanation,
            linkedinUrl: l.linkedin_url || "",
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load list");
      } finally {
        setLoading(false);
      }
    }
    fetchListDetail();
  }, [id]);

  function handleExportCSV() {
    if (!list || leads.length === 0) return;
    const safeName = list.name.replace(/[^a-zA-Z0-9\-_ ]/g, "").replace(/\s+/g, "_");
    exportLeadsToCSV(leads, `${safeName}.csv`);
  }

  async function handleEmail() {
    if (!list || leads.length === 0) return;
    const stored = localStorage.getItem("scraper-settings");
    const settings = stored ? JSON.parse(stored) : {};
    const recipientEmail = settings.recipientEmail;

    if (!recipientEmail) {
      setError("No recipient email configured. Add one in Settings.");
      return;
    }

    setEmailing(true);
    setError(null);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads,
          listName: list.name,
          resendApiKey: settings.resendApiKey || undefined,
          recipientEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setEmailing(false);
    }
  }

  async function handleDeleteList() {
    if (!confirm("Delete this list? This cannot be undone.")) return;
    setDeletingList(true);
    setError(null);
    try {
      const stored = localStorage.getItem("scraper-settings");
      const settings = stored ? JSON.parse(stored) : {};
      const qp = new URLSearchParams();
      if (settings.supabaseUrl) qp.set("supabaseUrl", settings.supabaseUrl);
      if (settings.supabaseAnonKey) qp.set("supabaseAnonKey", settings.supabaseAnonKey);

      const res = await fetch(`/api/lists/${id}?${qp.toString()}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      localStorage.removeItem("scraper-dashboard-leads");
      router.push("/lists");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete list");
      setDeletingList(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/lists"
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {loading ? "Loading..." : list?.name || "List"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {leads.length} leads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteList}
              disabled={deletingList || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
            >
              {deletingList ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deletingList ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={handleEmail}
              disabled={leads.length === 0 || emailing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors border border-gray-700"
            >
              {emailing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : emailSent ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {emailing ? "Sending..." : emailSent ? "Sent!" : "Email"}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-8 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex-1 px-8 pb-8 pt-4 overflow-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
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
                  {loading &&
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
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                        No leads in this list.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    leads.map((lead, i) => (
                      <tr
                        key={`${lead.name}-${i}`}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-white whitespace-nowrap">{lead.name}</td>
                        <td className="px-5 py-4 text-gray-300 whitespace-nowrap">{lead.company}</td>
                        <td className="px-5 py-4 text-gray-400 whitespace-nowrap">{lead.city}</td>
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
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-5 py-4 text-gray-400">
                          <p className="leading-relaxed">{lead.explanation}</p>
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
