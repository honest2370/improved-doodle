import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const supabase = await createClient();

    // Get active AI config
    const { data: configs } = await supabase
      .from("ai_configs")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    let response = "";

    if (configs && configs.length > 0 && configs[0].api_key) {
      const config = configs[0];
      try {
        if (config.provider === "gemini") {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.model || "gemini-1.5-flash"}:generateContent?key=${config.api_key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${config.instructions}\n\nUtilisateur: ${message}` }] }],
              }),
            }
          );
          if (geminiRes.ok) {
            const data = await geminiRes.json();
            response = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
        } else if (config.provider === "openai") {
          const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.api_key}`,
            },
            body: JSON.stringify({
              model: config.model || "gpt-3.5-turbo",
              messages: [
                { role: "system", content: config.instructions },
                { role: "user", content: message },
              ],
            }),
          });
          if (openaiRes.ok) {
            const data = await openaiRes.json();
            response = data.choices?.[0]?.message?.content || "";
          }
        }
      } catch {
        response = "";
      }
    }

    if (!response) {
      const lower = message.toLowerCase();
      if (lower.includes("bonjour") || lower.includes("salut"))
        response = "Bonjour ! Je suis ADF IA. Comment puis-je vous aider aujourd'hui ?";
      else if (lower.includes("service"))
        response = "ADF propose des services de design graphique, développement web, montage vidéo et plus. Consultez la section Services !";
      else if (lower.includes("prix") || lower.includes("tarif"))
        response = "Les prix varient selon le service. Rendez-vous dans la section Services pour voir nos tarifs.";
      else if (lower.includes("boutique") || lower.includes("produit"))
        response = "Notre boutique propose des templates, e-books, et ressources digitales. Visitez la section Boutique !";
      else if (lower.includes("contact"))
        response = "Vous pouvez nous contacter via le tableau de bord ou lors de votre commande.";
      else
        response = "Je comprends. Pourriez-vous me donner plus de détails ? Je peux vous aider avec nos services, la boutique, ou répondre à vos questions sur ADF.";
    }

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }
}
