"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  User,
  Package,
  ShoppingBag,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  LogOut,
  Loader2,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface ServiceOrder {
  id: string;
  title: string;
  status: string;
  price: number | null;
  created_at: string;
  services?: { name: string };
}

interface ProductOrder {
  id: string;
  status: string;
  created_at: string;
  products?: { name: string };
}

export default function DashboardPage() {
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: so }, { data: po }] = await Promise.all([
      supabase
        .from("service_orders")
        .select("*, services(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("product_orders")
        .select("*, products(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (so) setServiceOrders(so);
    if (po) setProductOrders(po);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4 text-adf-success" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-adf-danger" />;
      case "pending":
        return <Clock className="w-4 h-4 text-adf-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-adf-blue" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      approved: "Approuvé",
      rejected: "Rejeté",
      invoiced: "Facturé",
      paid: "Payé",
      sample_sent: "Échantillon",
      completed: "Terminé",
      proof_sent: "Preuve envoyée",
    };
    return labels[status] || status;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-adf-blue animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="adf-card p-8 text-center max-w-sm">
          <User className="w-12 h-12 text-adf-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Tableau de bord</h2>
          <p className="text-sm text-adf-text-muted mb-6">Connectez-vous pour accéder à votre tableau de bord</p>
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
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-adf-darker/90 border-b border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-xl bg-adf-card border border-adf-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-adf-blue" />
          </Link>
          <User className="w-5 h-5 text-adf-blue" />
          <h1 className="font-semibold text-lg">Tableau de bord</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="adf-card p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center adf-glow">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{profile?.full_name || "Utilisateur"}</h2>
              <p className="text-sm text-adf-text-muted">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-3 h-3 text-adf-cyan" />
                <span className="text-xs text-adf-blue-light">
                  Messages IA: {profile?.ai_messages_used || 0} / {profile?.ai_message_limit || 50}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Link href="/admin">
              <div className="adf-card p-4 flex items-center gap-3 border-adf-blue/30 hover:border-adf-blue/60 transition-colors">
                <Settings className="w-5 h-5 text-adf-blue" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Panneau Admin</h3>
                  <p className="text-xs text-adf-text-muted">Gérer les commandes, IA, et produits</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-adf-text-muted rotate-180" />
              </div>
            </Link>
          </motion.div>
        )}

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab("services")} className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === "services" ? "bg-adf-blue/20 text-adf-blue border border-adf-blue/30" : "bg-adf-card text-adf-text-muted border border-adf-border"}`}>
            <div className="flex items-center justify-center gap-2"><Package className="w-4 h-4" />Services</div>
          </button>
          <button onClick={() => setActiveTab("products")} className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === "products" ? "bg-adf-blue/20 text-adf-blue border border-adf-blue/30" : "bg-adf-card text-adf-text-muted border border-adf-border"}`}>
            <div className="flex items-center justify-center gap-2"><ShoppingBag className="w-4 h-4" />Produits</div>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-adf-blue animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === "services" ? (
              serviceOrders.length === 0 ? (
                <div className="adf-card p-8 text-center">
                  <Package className="w-12 h-12 text-adf-text-muted mx-auto mb-3" />
                  <p className="text-sm text-adf-text-muted">Aucune commande de service</p>
                  <Link href="/services"><button className="adf-btn mt-4 text-sm">Commander un service</button></Link>
                </div>
              ) : (
                serviceOrders.map((order) => (
                  <div key={order.id} className="adf-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{order.title}</h4>
                        <p className="text-xs text-adf-text-muted">{order.services?.name || "Service personnalisé"}</p>
                      </div>
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-adf-text-muted">{new Date(order.created_at).toLocaleDateString("fr-FR")}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${order.status === "completed" ? "bg-adf-success/10 text-adf-success" : order.status === "rejected" ? "bg-adf-danger/10 text-adf-danger" : "bg-adf-warning/10 text-adf-warning"}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    {order.price && (
                      <div className="mt-2 text-sm font-semibold text-adf-blue">{Number(order.price).toLocaleString("fr-FR")} FCFA</div>
                    )}
                  </div>
                ))
              )
            ) : productOrders.length === 0 ? (
              <div className="adf-card p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-adf-text-muted mx-auto mb-3" />
                <p className="text-sm text-adf-text-muted">Aucun achat de produit</p>
                <Link href="/store"><button className="adf-btn mt-4 text-sm">Acheter un produit</button></Link>
              </div>
            ) : (
              productOrders.map((po) => (
                <div key={po.id} className="adf-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{po.products?.name || "Produit"}</h4>
                    {getStatusIcon(po.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-adf-text-muted">{new Date(po.created_at).toLocaleDateString("fr-FR")}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${po.status === "approved" ? "bg-adf-success/10 text-adf-success" : po.status === "rejected" ? "bg-adf-danger/10 text-adf-danger" : "bg-adf-warning/10 text-adf-warning"}`}>
                      {getStatusLabel(po.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button onClick={signOut} className="w-full mt-6 adf-btn-secondary text-sm flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-adf-darker/90 border-t border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          <NavItem icon={HomeIcon} label="Accueil" href="/" />
          <NavItem icon={MessageSquareIcon} label="ADF IA" href="/chat" />
          <NavItem icon={BriefcaseIcon} label="Services" href="/services" />
          <NavItem icon={ShoppingBagIcon} label="Boutique" href="/store" />
          <NavItem icon={User} label="Profil" href="/dashboard" active />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon: Icon, label, href, active }: { icon: React.ElementType; label: string; href: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${active ? "text-adf-blue" : "text-adf-text-muted hover:text-adf-blue-light"}`}>
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

function HomeIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function MessageSquareIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function BriefcaseIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function ShoppingBagIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>; }
