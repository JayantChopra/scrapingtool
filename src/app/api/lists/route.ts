import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supabaseUrl = searchParams.get("supabaseUrl") || undefined;
    const supabaseAnonKey = searchParams.get("supabaseAnonKey") || undefined;

    const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

    // Delete all join table entries, then all lists, then all orphaned leads
    await supabase.from("list_leads").delete().neq("list_id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("lists").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete all lists error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete lists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const supabaseUrl = searchParams.get("supabaseUrl") || undefined;
    const supabaseAnonKey = searchParams.get("supabaseAnonKey") || undefined;

    const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

    const { data: lists, error } = await supabase
      .from("lists")
      .select("id, name, created_at, list_leads(count)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const transformed = (lists || []).map((list: Record<string, unknown>) => ({
      id: list.id,
      name: list.name,
      created_at: list.created_at,
      lead_count: Array.isArray(list.list_leads)
        ? (list.list_leads[0] as Record<string, number>)?.count ?? 0
        : 0,
    }));

    return NextResponse.json({ lists: transformed });
  } catch (error) {
    console.error("Fetch lists error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch lists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
