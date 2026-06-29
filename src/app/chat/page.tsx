"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Plus,
  Menu,
  X,
  MessageSquare,
  ChevronLeft,
  Bot,
  User,
  Loader2,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const LOCAL_AI_RESPONSES: Record<string, string> = {
  bonjour: "Bonjour ! Je suis ADF IA, votre assistant intelligent. Comment puis-je vous aider aujourd'hui ?",
  salut: "Salut ! Je suis ADF IA, prêt à vous aider avec vos besoins digitaux. Que puis-je faire pour vous ?",
  services: "ADF propose une large gamme de services digitaux : design graphique, création de logos, cartes de visite, développement web, et bien plus. Consultez la section Services !",
  prix: "Les prix varient selon le service. Rendez-vous dans la section Services pour voir nos tarifs et commander.",
  aide: "Je peux vous aider avec :\n1. Informations sur nos services\n2. Passer une commande\n3. Consulter la boutique\n4. Questions générales\n\nQue souhaitez-vous faire ?",
  contact: "Vous pouvez nous contacter via le tableau de bord ou directement lors de votre commande. Notre équipe vous répondra rapidement.",
  boutique: "Notre boutique propose des templates, e-books, icônes premium et plus. Visitez la section Boutique !",
  produit: "Nous avons des templates Canva, e-books marketing, packs d'icônes, cours UI/UX et bien plus dans notre boutique.",
  default: "Je comprends. Pourriez-vous me donner plus de détails ? Je peux vous aider avec nos services, la boutique, ou répondre à vos questions sur ADF.",
};

function getLocalResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(LOCAL_AI_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return LOCAL_AI_RESPONSES.default;
}

export default function ChatPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) loadSessions();
  }, [user]);

  useEffect(() => {
    if (currentSessionId) loadMessages(currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) {
      setSessions(data);
      if (data.length > 0 && !currentSessionId) setCurrentSessionId(data[0].id);
    }
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const createNewSession = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "Nouvelle conversation" })
      .select()
      .single();
    if (data) {
      setSessions((prev) => [data, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);
      setSidebarOpen(false);
    }
  };

  const deleteSession = async (id: string) => {
    await supabase.from("chat_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSessionId || !user) return;

    const userMsg = { session_id: currentSessionId, role: "user" as const, content: input.trim() };
    setInput("");
    setIsLoading(true);

    await supabase.from("chat_messages").insert(userMsg);
    await loadMessages(currentSessionId);

    // Update session title if first message
    const session = sessions.find((s) => s.id === currentSessionId);
    if (session && messages.length <= 1) {
      await supabase
        .from("chat_sessions")
        .update({ title: input.trim().slice(0, 40) + (input.trim().length > 40 ? "..." : "") })
        .eq("id", currentSessionId);
      loadSessions();
    }

    let response = "";

    if (isOnline) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg.content, sessionId: currentSessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          response = data.response;
        }
      } catch {
        response = getLocalResponse(userMsg.content);
      }
    }

    if (!response) response = getLocalResponse(userMsg.content);

    await supabase.from("chat_messages").insert({
      session_id: currentSessionId,
      role: "assistant",
      content: response,
    });

    await loadMessages(currentSessionId);
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="adf-card p-8 text-center max-w-sm">
          <Bot className="w-12 h-12 text-adf-blue mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">ADF IA</h2>
          <p className="text-sm text-adf-text-muted mb-6">
            Connectez-vous pour accéder à l&apos;assistant intelligent ADF IA
          </p>
          <Link href="/auth">
            <button className="adf-btn flex items-center justify-center gap-2 mx-auto">
              <LogIn className="w-4 h-4" />
              Se connecter
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-adf-darker">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-adf-darker/90 border-b border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-xl bg-adf-card border border-adf-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-adf-blue" />
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-xl bg-adf-card border border-adf-border flex items-center justify-center">
            <Menu className="w-5 h-5 text-adf-blue" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">ADF IA</h1>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-adf-success" : "bg-adf-warning"}`} />
                <span className="text-[10px] text-adf-text-muted">{isOnline ? "En ligne" : "Mode hors ligne"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-adf-blue/20" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}>
                {msg.role === "user" ? <User className="w-4 h-4 text-adf-blue" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-adf-blue/20 text-adf-text rounded-tr-sm" : "bg-adf-card border border-adf-border text-adf-text rounded-tl-sm"}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-adf-card border border-adf-border px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-4 h-4 text-adf-blue animate-spin" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-adf-darker/90 backdrop-blur-xl border-t border-adf-border p-4">
        <div className="max-w-lg mx-auto flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Écrivez votre message..." className="adf-input flex-1 text-sm" />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center adf-glow disabled:opacity-50">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-50" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25 }} className="fixed left-0 top-0 bottom-0 w-72 bg-adf-darker border-r border-adf-border z-50 flex flex-col">
              <div className="p-4 border-b border-adf-border flex items-center justify-between">
                <h2 className="font-semibold text-sm">Conversations</h2>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg bg-adf-card flex items-center justify-center">
                  <X className="w-4 h-4 text-adf-text-muted" />
                </button>
              </div>
              <button onClick={createNewSession} className="adf-btn-secondary m-4 flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Nouvelle conversation
              </button>
              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {sessions.map((session) => (
                  <div key={session.id} onClick={() => { setCurrentSessionId(session.id); setSidebarOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${currentSessionId === session.id ? "bg-adf-blue/10 border border-adf-blue/30" : "hover:bg-adf-card border border-transparent"}`}>
                    <MessageSquare className="w-4 h-4 text-adf-text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{session.title}</p>
                      <p className="text-[10px] text-adf-text-muted">{new Date(session.updated_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="w-6 h-6 rounded hover:bg-adf-danger/20 flex items-center justify-center">
                      <X className="w-3 h-3 text-adf-text-muted hover:text-adf-danger" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
