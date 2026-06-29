"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ShoppingBag,
  Search,
  ShoppingCart,
  Star,
  CheckCircle,
  Upload,
  X,
  LogIn,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  image_urls: string[];
}

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  details: Record<string, string>;
}

export default function StorePage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({ paymentMethod: "" });
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: prods }, { data: payments }] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true),
      supabase.from("payment_methods").select("*").eq("is_active", true),
    ]);
    if (prods) setProducts(prods);
    if (payments) {
      setPaymentMethods(payments);
      if (payments.length > 0) setOrderForm({ paymentMethod: String(payments[0].id) });
    }
    setLoading(false);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct) return;

    const { error } = await supabase.from("product_orders").insert({
      user_id: user.id,
      product_id: selectedProduct.id,
      status: "pending",
      proof_url: proofFile,
    });

    if (!error) {
      setSubmitted(true);
    }
  };

  const selectedPayment = paymentMethods.find((p) => String(p.id) === orderForm.paymentMethod);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-adf-blue animate-spin" />
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
          <ShoppingBag className="w-5 h-5 text-adf-blue" />
          <h1 className="font-semibold text-lg">Boutique</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Boutique <span className="adf-gradient-text">Digitale</span></h2>
          <p className="text-sm text-adf-text-muted">Produits digitaux exclusifs ADF</p>
        </motion.div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-adf-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="adf-input w-full pl-10 text-sm" />
        </div>

        {submitted && selectedProduct ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="adf-card p-8 text-center">
            <CheckCircle className="w-16 h-16 text-adf-success mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Commande envoyée !</h3>
            <p className="text-sm text-adf-text-muted mb-2">Votre commande pour <strong>{selectedProduct.name}</strong> a été enregistrée.</p>
            <p className="text-sm text-adf-text-muted mb-6">L&apos;administrateur vérifiera votre paiement et vous enverra le produit.</p>
            <button onClick={() => { setSubmitted(false); setSelectedProduct(null); setProofFile(null); }} className="adf-btn text-sm">Continuer les achats</button>
          </motion.div>
        ) : selectedProduct ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <button onClick={() => setSelectedProduct(null)} className="adf-btn-secondary text-sm flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>

            <div className="adf-card p-5">
              <div className="w-full h-40 rounded-xl bg-gradient-to-br from-adf-blue/20 to-adf-purple/20 flex items-center justify-center mb-4">
                <ShoppingBag className="w-12 h-12 text-adf-blue/50" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-md bg-adf-blue/10 text-adf-blue text-xs capitalize">{selectedProduct.type}</span>
                <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-adf-warning fill-adf-warning" />)}</div>
              </div>
              <h3 className="font-bold text-lg mb-1">{selectedProduct.name}</h3>
              <p className="text-sm text-adf-text-muted mb-3">{selectedProduct.description}</p>
              <div className="text-2xl font-bold adf-gradient-text">{selectedProduct.price.toLocaleString("fr-FR")} FCFA</div>
            </div>

            {!user ? (
              <div className="adf-card p-6 text-center">
                <LogIn className="w-10 h-10 text-adf-text-muted mx-auto mb-3" />
                <p className="text-sm text-adf-text-muted mb-4">Connectez-vous pour acheter ce produit</p>
                <Link href="/auth"><button className="adf-btn text-sm">Se connecter</button></Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="font-semibold text-sm">Paiement</h4>

                <div>
                  <label className="text-sm font-medium mb-1 block">Méthode de paiement</label>
                  <select value={orderForm.paymentMethod} onChange={(e) => setOrderForm({ paymentMethod: e.target.value })} className="adf-input w-full text-sm">
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                  </select>
                </div>

                {selectedPayment && (
                  <div className="adf-card p-3 bg-adf-blue/5 border-adf-blue/20">
                    <p className="text-xs text-adf-text-muted mb-1">Effectuez le paiement à :</p>
                    <p className="text-sm font-medium text-adf-blue">{selectedPayment.details.number || selectedPayment.details.email}</p>
                    <p className="text-xs text-adf-text-muted">{selectedPayment.details.holder}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">Preuve de paiement (capture d&apos;écran)</label>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="proof-upload" />
                    <label htmlFor="proof-upload" className="adf-btn-secondary w-full flex items-center justify-center gap-2 text-sm cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {proofFile ? "Modifier la preuve" : "Ajouter une preuve"}
                    </label>
                  </div>
                  {proofFile && (
                    <div className="mt-2 relative">
                      <img src={proofFile} alt="Preuve" className="w-full h-32 object-cover rounded-xl" />
                      <button type="button" onClick={() => setProofFile(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-adf-danger flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full adf-btn flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Confirmer la commande
                </button>
              </form>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedProduct(product)} className="adf-card overflow-hidden cursor-pointer hover:border-adf-blue/40 transition-all">
                <div className="h-28 bg-gradient-to-br from-adf-blue/10 to-adf-purple/10 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-adf-blue/40" />
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-adf-blue bg-adf-blue/10 px-1.5 py-0.5 rounded capitalize">{product.type}</span>
                  <h4 className="font-medium text-sm mt-1 truncate">{product.name}</h4>
                  <p className="text-[10px] text-adf-text-muted line-clamp-2 mb-2">{product.description}</p>
                  <div className="font-bold text-adf-blue text-sm">{product.price.toLocaleString("fr-FR")} FCFA</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-adf-darker/90 border-t border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          <NavItem icon={HomeIcon} label="Accueil" href="/" />
          <NavItem icon={MessageSquareIcon} label="ADF IA" href="/chat" />
          <NavItem icon={BriefcaseIcon} label="Services" href="/services" />
          <NavItem icon={ShoppingBag} label="Boutique" href="/store" active />
          <NavItem icon={UserIcon} label="Profil" href={user ? "/dashboard" : "/auth"} />
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
function UserIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
