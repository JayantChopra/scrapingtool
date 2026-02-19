import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { cityToProvince, PROVINCE_NAMES } from "@/lib/provinces";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supabaseUrl = searchParams.get("supabaseUrl") || undefined;
    const supabaseAnonKey = searchParams.get("supabaseAnonKey") || undefined;

    const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

    const { data: leads, error } = await supabase
      .from("leads")
      .select("city");

    if (error) throw error;

    const provinceCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    let unmapped = 0;

    for (const lead of leads || []) {
      const city = lead.city;
      cityCounts[city] = (cityCounts[city] || 0) + 1;

      const province = cityToProvince(city);
      if (province) {
        provinceCounts[province] = (provinceCounts[province] || 0) + 1;
      } else {
        unmapped++;
      }
    }

    // Build province stats with names
    const provinces = Object.entries(PROVINCE_NAMES).map(([code, name]) => ({
      code,
      name,
      count: provinceCounts[code] || 0,
    }));

    // Top cities sorted by count
    const cities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count, province: cityToProvince(city) }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      provinces,
      cities,
      totalLeads: (leads || []).length,
      unmapped,
    });
  } catch (error) {
    console.error("Geography stats error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch geography data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
