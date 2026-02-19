"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  List,
  Calendar,
  ChevronRight,
  Loader2,
  Users,
  Trash2,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import { LeadList } from "@/lib/types";

export default function ListsPage() {
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchLists() {
      try {
        const stored = localStorage.getItem("scraper-settings");
        const settings = stored ? JSON.parse(stored) : {};
        const params = new URLSearchParams();
        if (settings.supabaseUrl) params.set("supabaseUrl", settings.supabaseUrl);
        if (settings.supabaseAnonKey) params.set("supabaseAnonKey", settings.supabaseAnonKey);

        const res = await fetch(`/api/lists?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${res.status})`);
        }
        const data = await res.json();
        setLists(data.lists);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lists");
      } finally {
        setLoading(false);
      }
    }
    fetchLists();
  }, []);

  async function handleDeleteAll() {
    if (!confirm("Delete all lists and leads? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const stored = localStorage.getItem("scraper-settings");
      const settings = stored ? JSON.parse(stored) : {};
      const params = new URLSearchParams();
      if (settings.supabaseUrl) params.set("supabaseUrl", settings.supabaseUrl);
      if (settings.supabaseAnonKey) params.set("supabaseAnonKey", settings.supabaseAnonKey);

      const res = await fetch(`/api/lists?${params.toString()}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setLists([]);
      localStorage.removeItem("scraper-dashboard-leads");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lists");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Lists</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Browse saved lead generation runs
            </p>
          </div>
          {lists.length > 0 && !loading && (
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleting ? "Deleting..." : "Delete All"}
            </button>
          )}
        </header>

        {error && (
          <div className="mx-8 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex-1 px-8 py-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <List className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No lists yet. Generate leads from the Dashboard to create your first list.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 hover:bg-gray-800/50 transition-colors group"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-white">{list.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(list.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {list.lead_count} leads
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
