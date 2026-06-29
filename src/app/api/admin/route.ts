import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    switch (type) {
      case "ai": {
        const { data } = await supabase.from("ai_configs").select("*");
        return NextResponse.json(data || []);
      }
      case "orders": {
        const { data } = await supabase.from("service_orders").select("*, profiles(email, full_name), services(name)").order("created_at", { ascending: false });
        return NextResponse.json(data || []);
      }
      case "products": {
        const { data } = await supabase.from("products").select("*");
        return NextResponse.json(data || []);
      }
      case "payments": {
        const { data } = await supabase.from("payment_methods").select("*");
        return NextResponse.json(data || []);
      }
      default:
        return NextResponse.json([]);
    }
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    switch (body.type) {
      case "ai": {
        const { error } = await supabase.from("ai_configs").upsert(body.data);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }
      case "order": {
        const update: any = { status: body.status };
        if (body.price) update.price = body.price;
        const { error } = await supabase.from("service_orders").update(update).eq("id", body.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }
      case "product": {
        const { data, error } = await supabase.from("products").insert(body.data).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
      }
      case "payment": {
        const { data, error } = await supabase.from("payment_methods").insert(body.data).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
      }
      default:
        return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    if (body.type === "product") {
      const { error } = await supabase.from("products").delete().eq("id", body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
