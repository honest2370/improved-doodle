"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Settings,
  Bot,
  Package,
  ShoppingBag,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Save,
  Upload,
  Sparkles,
  Lock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface AIConfig {
  id: number;
  provider: string;
  api_key: string;
  base_url: string;
  model: string;
  is_active: boolean;
  instructions: string;
}

interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  price: number | null;
  admin_notes: string | null;
  created_at: string;
  profiles: { email: string; full_name: string } | null;
  services: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  is_active: boolean;
}

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  details: Record<string, string>;
  is_active: boolean;
}

export default function AdminPage() {
  const { user, profile, isAdmin } = useAuth();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"ai" | "orders" | "products" | "payments" | "users">("ai");
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", type: "digital", price: "" });
  const [newPayment, setNewPayment] = useState({ name: "", type: "om", details: {} as Record<string, string> });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: ai }, { data: ord }, { data: prod }, { data: pay }] = await Promise.all([
      supabase.from("ai_configs").select("*"),
      supabase.from("service_orders").select("*, profiles(email, full_name), services(name)").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("payment_methods").select("*"),
    ]);
    if (ai) setAiConfigs(ai);
    if (ord) setOrders(ord);
    if (prod) setProducts(prod);
    if (pay) setPaymentMethods(pay);
    setLoading(false);
  };

  const login = () => {
    if (password === "adfadmin2024") {
      setIsAuthenticated(true);
      loadData();
    } else {
      setMessage("Mot de passe incorrect");
    }
  };

  const saveAIConfig = async (config: AIConfig) => {
    const { error } = await supabase.from("ai_configs").upsert({
      id: config.id,
      provider: config.provider,
      api_key: config.api_key,
      base_url: config.base_url,
      model: config.model,
      is_active: config.is_active,
      instructions: config.instructions,
    });
    if (!error) {
      setMessage("Configuration IA sauvegardée");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const updateOrderStatus = async (id: string, status: string, price?: string) => {
    const update: any = { status };
    if (price) update.price = price;
    await supabase.from("service_orders").update(update).eq("id", id);
    loadData();
  };

  const addProduct = async () => {
    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      description: newProduct.description,
      type: newProduct.type,
      price: Number(newProduct.price),
    });
    if (!error) {
      setNewProduct({ name: "", description: "", type: "digital", price: "" });
      loadData();
      setMessage("Produit ajouté");
    }
  };

  const addPaymentMethod = async () => {
    const { error } = await supabase.from("payment_methods").insert(newPayment);
    if (!error) {
      setNewPayment({ name: "", type: "om", details: {} });
      loadData();
      setMessage("Méthode de paiement ajoutée");
    }
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    loadData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="adf-card p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 adf-glow">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold adf-gradient-text">Administration ADF</h1>
            <p className="text-sm text-adf-text-muted mt-1">Accès réservé au PDG</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="••••••••" className="adf-input w-full text-sm" />
            </div>
            {message && <p className="text-sm text-adf-danger text-center">{message}</p>}
            <button onClick={login} className="w-full adf-btn">Se connecter</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-adf-darker/90 border-b border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-adf-card border border-adf-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-adf-blue" />
          </Link>
          <Settings className="w-5 h-5 text-adf-blue" />
          <h1 className="font-semibold text-lg">Admin ADF</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-xl bg-adf-success/10 border border-adf-success/30 text-adf-success text-sm text-center">
            {message}
          </motion.div>
        )}

        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { id: "ai", icon: Bot, label: "IA" },
            { id: "orders", icon: Package, label: "Cmds" },
            { id: "products", icon: ShoppingBag, label: "Prod" },
            { id: "payments", icon: CreditCard, label: "Pay" },
            { id: "users", icon: Users, label: "Users" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-colors ${activeTab === tab.id ? "bg-adf-blue/20 text-adf-blue border border-adf-blue/30" : "bg-adf-card text-adf-text-muted border border-adf-border"}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-adf-blue animate-spin" />
          </div>
        )}

        {!loading && activeTab === "ai" && (
          <div className="space-y-4">
            <div className="adf-card p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-adf-cyan" />
                Configurations IA
              </h3>
              <p className="text-xs text-adf-text-muted mb-4">Configurez les APIs pour ADF IA. Seule l&apos;API active sera utilisée.</p>
            </div>

            {aiConfigs.map((config) => (
              <motion.div key={config.provider} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="adf-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize text-sm">{config.provider === "openai" ? "OpenAI" : config.provider}</h4>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-adf-text-muted">Actif</span>
                    <input type="checkbox" checked={config.is_active} onChange={(e) => saveAIConfig({ ...config, is_active: e.target.checked })} className="w-4 h-4 rounded accent-adf-blue" />
                  </label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-adf-text-muted mb-1 block">Clé API</label>
                    <input type="password" value={config.api_key || ""} onChange={(e) => setAiConfigs(aiConfigs.map((c) => c.provider === config.provider ? { ...c, api_key: e.target.value } : c))} placeholder="sk-..." className="adf-input w-full text-xs" />
                  </div>
                  <div>
                    <label className="text-xs text-adf-text-muted mb-1 block">Modèle</label>
                    <input value={config.model || ""} onChange={(e) => setAiConfigs(aiConfigs.map((c) => c.provider === config.provider ? { ...c, model: e.target.value } : c))} placeholder="gpt-4, claude-3, etc." className="adf-input w-full text-xs" />
                  </div>
                  <div>
                    <label className="text-xs text-adf-text-muted mb-1 block">Instructions système</label>
                    <textarea value={config.instructions || ""} onChange={(e) => setAiConfigs(aiConfigs.map((c) => c.provider === config.provider ? { ...c, instructions: e.target.value } : c))} placeholder="Instructions pour l'IA..." rows={3} className="adf-input w-full text-xs resize-none" />
                  </div>
                  <button onClick={() => saveAIConfig(config)} className="adf-btn text-xs flex items-center gap-2">
                    <Save className="w-3 h-3" />
                    Sauvegarder
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && activeTab === "orders" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm mb-2">Commandes de services ({orders.length})</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-adf-text-muted text-center py-8">Aucune commande</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="adf-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{order.title}</h4>
                      <p className="text-xs text-adf-text-muted">{order.profiles?.full_name || order.profiles?.email}</p>
                      <p className="text-[10px] text-adf-text-muted">{order.services?.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === "completed" ? "bg-adf-success/10 text-adf-success" : order.status === "rejected" ? "bg-adf-danger/10 text-adf-danger" : "bg-adf-warning/10 text-adf-warning"}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-adf-text-muted mb-3 line-clamp-2">{order.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {order.status === "pending" && (
                      <>
                        <button onClick={() => updateOrderStatus(order.id, "approved")} className="px-3 py-1.5 rounded-lg bg-adf-success/20 text-adf-success text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />Approuver
                        </button>
                        <button onClick={() => updateOrderStatus(order.id, "rejected")} className="px-3 py-1.5 rounded-lg bg-adf-danger/20 text-adf-danger text-xs font-medium flex items-center gap-1">
                          <XCircle className="w-3 h-3" />Rejeter
                        </button>
                      </>
                    )}
                    {order.status === "approved" && (
                      <div className="flex gap-2 items-center w-full">
                        <input type="text" placeholder="Prix (FCFA)" className="adf-input text-xs flex-1" id={`price-${order.id}`} />
                        <button onClick={() => { const price = (document.getElementById(`price-${order.id}`) as HTMLInputElement)?.value; updateOrderStatus(order.id, "invoiced", price); }} className="adf-btn text-xs">Facturer</button>
                      </div>
                    )}
                    {order.status === "paid" && (
                      <button onClick={() => updateOrderStatus(order.id, "sample_sent")} className="px-3 py-1.5 rounded-lg bg-adf-blue/20 text-adf-blue text-xs font-medium">Envoyer échantillon</button>
                    )}
                    {order.status === "sample_sent" && (
                      <button onClick={() => updateOrderStatus(order.id, "completed")} className="px-3 py-1.5 rounded-lg bg-adf-success/20 text-adf-success text-xs font-medium">Marquer terminé</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && activeTab === "products" && (
          <div className="space-y-4">
            <div className="adf-card p-4">
              <h3 className="font-semibold text-sm mb-3">Ajouter un produit</h3>
              <div className="space-y-3">
                <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nom du produit" className="adf-input w-full text-sm" />
                <textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Description" rows={2} className="adf-input w-full text-sm resize-none" />
                <select value={newProduct.type} onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })} className="adf-input w-full text-sm">
                  <option value="digital">Digital</option>
                  <option value="template">Template</option>
                  <option value="ebook">E-book</option>
                  <option value="software">Logiciel</option>
                  <option value="course">Cours</option>
                  <option value="other">Autre</option>
                </select>
                <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Prix (FCFA)" className="adf-input w-full text-sm" />
                <button onClick={addProduct} className="w-full adf-btn text-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />Ajouter le produit
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-sm">Produits ({products.length})</h3>
            {products.map((product) => (
              <div key={product.id} className="adf-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-adf-text-muted">{product.type} · {product.price.toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  <button onClick={() => deleteProduct(product.id)} className="w-8 h-8 rounded-lg bg-adf-danger/20 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-adf-danger" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === "payments" && (
          <div className="space-y-4">
            <div className="adf-card p-4">
              <h3 className="font-semibold text-sm mb-3">Ajouter une méthode de paiement</h3>
              <div className="space-y-3">
                <input value={newPayment.name} onChange={(e) => setNewPayment({ ...newPayment, name: e.target.value })} placeholder="Nom (ex: Orange Money)" className="adf-input w-full text-sm" />
                <select value={newPayment.type} onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })} className="adf-input w-full text-sm">
                  <option value="om">Orange Money</option>
                  <option value="momo">Mobile Money</option>
                  <option value="paypal">PayPal</option>
                  <option value="card">Carte Bancaire</option>
                  <option value="bank">Virement Bancaire</option>
                </select>
                <input value={newPayment.details.number || ""} onChange={(e) => setNewPayment({ ...newPayment, details: { ...newPayment.details, number: e.target.value } })} placeholder="Numéro / Email de paiement" className="adf-input w-full text-sm" />
                <input value={newPayment.details.holder || ""} onChange={(e) => setNewPayment({ ...newPayment, details: { ...newPayment.details, holder: e.target.value } })} placeholder="Nom du titulaire" className="adf-input w-full text-sm" />
                <button onClick={addPaymentMethod} className="w-full adf-btn text-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />Ajouter
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-sm">Méthodes ({paymentMethods.length})</h3>
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="adf-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{pm.name}</h4>
                    <p className="text-xs text-adf-text-muted">{pm.type} · {pm.details?.number || pm.details?.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${pm.is_active ? "bg-adf-success/10 text-adf-success" : "bg-adf-danger/10 text-adf-danger"}`}>
                    {pm.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === "users" && (
          <div className="adf-card p-6 text-center">
            <Users className="w-12 h-12 text-adf-text-muted mx-auto mb-3" />
            <p className="text-sm text-adf-text-muted">Gestion des utilisateurs via Supabase Dashboard</p>
            <p className="text-xs text-adf-text-muted mt-2">Limite IA par défaut: 50 messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
