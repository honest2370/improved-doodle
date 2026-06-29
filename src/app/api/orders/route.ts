import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase
      .from("service_orders")
      .insert({
        user_id: user.id,
        service_id: body.serviceId,
        title: body.title,
        description: body.description,
        requirements: body.requirements,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ orders: [], productOrders: [] });

    const [{ data: orders }, { data: productOrders }] = await Promise.all([
      supabase.from("service_orders").select("*").eq("user_id", user.id),
      supabase.from("product_orders").select("*").eq("user_id", user.id),
    ]);

    return NextResponse.json({ orders: orders || [], productOrders: productOrders || [] });
  } catch {
    return NextResponse.json({ orders: [], productOrders: [] });
  }
}
