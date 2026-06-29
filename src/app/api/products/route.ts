import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("products").select("*").eq("is_active", true);
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
