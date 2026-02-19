"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, TrendingUp } from "lucide-react";
import Sidebar from "@/components/sidebar";
import CanadaMap from "@/components/canada-map";

interface ProvinceData {
  code: string;
  name: string;
  count: number;
}

interface CityData {
  city: string;
  count: number;
  province: string | null;
}

interface GeoData {
  provinces: ProvinceData[];
  cities: CityData[];
  totalLeads: number;
}

export default function GeographyPage() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGeo() {
      try {
        const stored = localStorage.getItem("scraper-settings");
        const settings = stored ? JSON.parse(stored) : {};
        const params = new URLSearchParams();
        if (settings.supabaseUrl) params.set("supabaseUrl", settings.supabaseUrl);
        if (settings.supabaseAnonKey) params.set("supabaseAnonKey", settings.supabaseAnonKey);

        const res = await fetch(`/api/geography?${params.toString()}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `Request failed (${res.status})`);
        }
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load geography data");
      } finally {
        setLoading(false);
      }
    }
    fetchGeo();
  }, []);

  const maxCount = data
    ? Math.max(...data.provinces.map((p) => p.count), 1)
    : 1;

  const topProvince = data
    ? [...data.provinces].sort((a, b) => b.count - a.count)[0]
    : null;

  const topCity = data?.cities[0] ?? null;
  const activeProvinces = data?.provinces.filter((p) => p.count > 0).length ?? 0;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-5 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Geography</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Lead distribution across Canadian provinces
          </p>
        </header>

        {error && (
          <div className="mx-8 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : !data || data.totalLeads === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No lead data yet. Generate leads from the Dashboard first.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</p>
                <p className="text-2xl font-semibold text-white mt-1">{data.totalLeads}</p>
                <p className="text-xs text-gray-500 mt-1">Across Canada</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Provinces</p>
                <p className="text-2xl font-semibold text-white mt-1">{activeProvinces}</p>
                <p className="text-xs text-gray-500 mt-1">With leads</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Top Province</p>
                <p className="text-2xl font-semibold text-white mt-1">{topProvince?.code ?? "--"}</p>
                <p className="text-xs text-gray-500 mt-1">{topProvince?.count ?? 0} leads</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Top City</p>
                <p className="text-2xl font-semibold text-white mt-1">{topCity?.city ?? "--"}</p>
                <p className="text-xs text-gray-500 mt-1">{topCity?.count ?? 0} leads</p>
              </div>
            </div>

            {/* Map + Side Stats */}
            <div className="grid grid-cols-3 gap-6">
              {/* Map */}
              <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Province Map</h3>
                <CanadaMap provinces={data.provinces} maxCount={maxCount} />
              </div>

              {/* Province Bars */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  By Province
                </h3>
                <div className="space-y-3">
                  {[...data.provinces]
                    .sort((a, b) => b.count - a.count)
                    .filter((p) => p.count > 0)
                    .map((p) => (
                      <div key={p.code} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{p.name}</span>
                          <span className="text-white font-medium">{p.count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${(p.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  {data.provinces.every((p) => p.count === 0) && (
                    <p className="text-sm text-gray-600">No province data yet</p>
                  )}
                </div>

                {/* City list below */}
                <h3 className="text-sm font-semibold text-white mt-8 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  Top Cities
                </h3>
                <div className="space-y-2">
                  {data.cities.slice(0, 10).map((c) => (
                    <div key={c.city} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{c.city}</span>
                      <div className="flex items-center gap-2">
                        {c.province && (
                          <span className="text-xs text-gray-500">{c.province}</span>
                        )}
                        <span className="text-white font-medium w-6 text-right">{c.count}</span>
                      </div>
                    </div>
                  ))}
                  {data.cities.length === 0 && (
                    <p className="text-sm text-gray-600">No city data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
