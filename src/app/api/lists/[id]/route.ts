import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const supabaseUrl = searchParams.get("supabaseUrl") || undefined;
    const supabaseAnonKey = searchParams.get("supabaseAnonKey") || undefined;

    const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

    // Delete join table entries first
    await supabase.from("list_leads").delete().eq("list_id", id);
    // Delete the list itself
    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete list error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const supabaseUrl = searchParams.get("supabaseUrl") || undefined;
    const supabaseAnonKey = searchParams.get("supabaseAnonKey") || undefined;

    const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);

    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("id, name, created_at")
      .eq("id", id)
      .single();

    if (listError) throw listError;

    // Fetch leads through the join table
    const { data: joinRows, error: joinError } = await supabase
      .from("list_leads")
      .select("leads(*)")
      .eq("list_id", id);

    if (joinError) throw joinError;

    const leads = (joinRows || [])
      .map((row: Record<string, unknown>) => row.leads)
      .filter(Boolean);

    return NextResponse.json({ list, leads });
  } catch (error) {
    console.error("Fetch list detail error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
