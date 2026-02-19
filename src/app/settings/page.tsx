"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Key,
  UserSearch,
  Save,
  Check,
  Database,
  SlidersHorizontal,
  Mail,
} from "lucide-react";
import Sidebar from "@/components/sidebar";

export default function SettingsPage() {
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [exaApiKey, setExaApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("scraper-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      setReferenceUrls(settings.referenceUrls ?? []);
      setExaApiKey(settings.exaApiKey ?? "");
      setGeminiApiKey(settings.geminiApiKey ?? "");
      setSupabaseUrl(settings.supabaseUrl ?? "");
      setSupabaseAnonKey(settings.supabaseAnonKey ?? "");
      setResendApiKey(settings.resendApiKey ?? "");
      setRecipientEmail(settings.recipientEmail ?? "");
      setMaxResults(settings.maxResults ?? 10);
    }
  }, []);

  function handleMaxResultsChange(value: number) {
    setMaxResults(value);
    const stored = localStorage.getItem("scraper-settings");
    const settings = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      "scraper-settings",
      JSON.stringify({ ...settings, maxResults: value })
    );
  }

  function handleAddUrl() {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    setReferenceUrls((prev) => [...prev, trimmed]);
    setNewUrl("");
  }

  function handleRemoveUrl(index: number) {
    setReferenceUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    localStorage.setItem(
      "scraper-settings",
      JSON.stringify({
        referenceUrls,
        exaApiKey,
        geminiApiKey,
        supabaseUrl,
        supabaseAnonKey,
        resendApiKey,
        recipientEmail,
        maxResults,
      })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure your scraper and API keys
            </p>
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </header>

        <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
          {/* Reference Scrape */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <UserSearch className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Reference Scrape</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Add LinkedIn profiles or article URLs of people you want to find similar leads to.
              The scraper uses Exa&apos;s neural search to find people with matching signals.
            </p>

            <div className="flex gap-3 mb-4">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                placeholder="https://www.linkedin.com/in/someone/"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddUrl}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {referenceUrls.length === 0 ? (
              <p className="text-sm text-gray-600 py-4 text-center border border-dashed border-gray-800 rounded-lg">
                No reference URLs added yet. Add a LinkedIn profile to improve scrape accuracy.
              </p>
            ) : (
              <div className="space-y-2">
                {referenceUrls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-800/50 border border-gray-800 rounded-lg px-4 py-3"
                  >
                    <span className="text-sm text-gray-300 truncate mr-4">{url}</span>
                    <button
                      onClick={() => handleRemoveUrl(i)}
                      className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Per Generate */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Results Per Generate</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Control how many leads are generated per button click. Changes save automatically.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">5</span>
                <span className="text-2xl font-semibold text-white">{maxResults}</span>
                <span className="text-sm text-gray-400">25</span>
              </div>
              <input
                type="range"
                min={5}
                max={25}
                step={1}
                value={maxResults}
                onChange={(e) => handleMaxResultsChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-xs text-gray-500 text-center">
                {maxResults} leads per generate
              </p>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">API Keys</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Override the default API keys. Keys are stored locally in your browser — never sent to any third party.
              If left blank, the server&apos;s environment variables will be used.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Exa API Key
                </label>
                <input
                  type="password"
                  value={exaApiKey}
                  onChange={(e) => setExaApiKey(e.target.value)}
                  placeholder="Leave blank to use server default"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Leave blank to use server default"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Supabase */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Supabase</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Connect your own Supabase project to persist leads and lists.
              If left blank, the server&apos;s environment variables will be used.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Supabase URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="Leave blank to use server default"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <Mail className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Email Notifications</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Automatically email a CSV of generated leads after each run.
              Requires a <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Resend</a> API key (free tier: 100 emails/day).
              If left blank, emails won&apos;t be sent.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Resend API Key
                </label>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_xxxxxxxxxx"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="doug@example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Deployment Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-white mb-1">Deployment</h3>
            <p className="text-sm text-gray-500">
              This app is Vercel-ready. API keys can be set per-user here in Settings, or globally
              via environment variables (<code className="text-gray-400">EXA_API_KEY</code>,{" "}
              <code className="text-gray-400">GOOGLE_GENERATIVE_AI_API_KEY</code>,{" "}
              <code className="text-gray-400">SUPABASE_URL</code>,{" "}
              <code className="text-gray-400">SUPABASE_ANON_KEY</code>,{" "}
              <code className="text-gray-400">RESEND_API_KEY</code>) in your
              Vercel project settings. User-provided keys take priority over env vars.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
