"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Briefcase,
  Palette,
  PenTool,
  Code,
  Smartphone,
  Video,
  FileText,
  ShoppingCart,
  CheckCircle,
  Clock,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  base_price: number;
}

const categoryIcons: Record<string, React.ElementType> = {
  "Design Graphique": Palette,
  "Identité Visuelle": PenTool,
  "Développement Web": Code,
  "Applications Mobiles": Smartphone,
  "Montage Vidéo": Video,
  "Rédaction": FileText,
};

export default function ServicesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [services, setServices] = useState<Service[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Service[]>>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderForm, setOrderForm] = useState({ title: "", description: "", requirements: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").eq("is_active", true).order("category");
    if (data) {
      setServices(data);
      const g: Record<string, Service[]> = {};
      data.forEach((s) => {
        if (!g[s.category]) g[s.category] = [];
        g[s.category].push(s);
      });
      setGrouped(g);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedService) return;

    const { error } = await supabase.from("service_orders").insert({
      user_id: user.id,
      service_id: selectedService.id,
      title: orderForm.title,
      description: orderForm.description,
      requirements: orderForm.requirements,
      status: "pending",
    });

    if (!error) {
      setSubmitted(true);
      setOrderForm({ title: "", description: "", requirements: "" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-adf-blue/30 border-t-adf-blue rounded-full animate-spin" />
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
          <Briefcase className="w-5 h-5 text-adf-blue" />
          <h1 className="font-semibold text-lg">Nos Services</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Services <span className="adf-gradient-text">Digitaux</span></h2>
          <p className="text-sm text-adf-text-muted">Commandez des services professionnels de qualité</p>
        </motion.div>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="adf-card p-8 text-center">
            <CheckCircle className="w-16 h-16 text-adf-success mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Commande envoyée !</h3>
            <p className="text-sm text-adf-text-muted mb-6">Notre équipe examinera votre demande et vous enverra un devis sous peu.</p>
            <button onClick={() => { setSubmitted(false); setSelectedService(null); }} className="adf-btn text-sm">
              Commander un autre service
            </button>
          </motion.div>
        ) : selectedService ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <button onClick={() => setSelectedService(null)} className="adf-btn-secondary text-sm flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>

            <div className="adf-card p-5">
              <h3 className="font-bold text-lg mb-1">{selectedService.name}</h3>
              <p className="text-adf-text-muted text-sm mb-3">{selectedService.description}</p>
              <div className="text-2xl font-bold adf-gradient-text">
                {selectedService.base_price?.toLocaleString("fr-FR")} FCFA
              </div>
            </div>

            {!user ? (
              <div className="adf-card p-6 text-center">
                <LogIn className="w-10 h-10 text-adf-text-muted mx-auto mb-3" />
                <p className="text-sm text-adf-text-muted mb-4">Connectez-vous pour commander ce service</p>
                <Link href="/auth">
                  <button className="adf-btn text-sm">Se connecter</button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Titre du projet</label>
                  <input required value={orderForm.title} onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })} placeholder="Ex: Logo pour ma startup" className="adf-input w-full text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description détaillée</label>
                  <textarea required value={orderForm.description} onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })} placeholder="Décrivez votre projet en détail..." rows={4} className="adf-input w-full text-sm resize-none" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Exigences spécifiques</label>
                  <textarea value={orderForm.requirements} onChange={(e) => setOrderForm({ ...orderForm, requirements: e.target.value })} placeholder="Couleurs préférées, style, références..." rows={3} className="adf-input w-full text-sm resize-none" />
                </div>
                <button type="submit" className="w-full adf-btn flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Envoyer la commande
                </button>
              </form>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, svcs], ci) => {
              const Icon = categoryIcons[category] || Briefcase;
              return (
                <motion.div key={category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-adf-blue" />
                    <h3 className="font-semibold">{category}</h3>
                  </div>
                  <div className="space-y-2">
                    {svcs.map((service) => (
                      <div key={service.id} onClick={() => setSelectedService(service)} className="adf-card p-4 flex items-center justify-between cursor-pointer hover:border-adf-blue/40 transition-all">
                        <div>
                          <h4 className="font-medium text-sm">{service.name}</h4>
                          <p className="text-xs text-adf-text-muted">{service.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-adf-blue text-sm">{service.base_price?.toLocaleString("fr-FR")} FCFA</div>
                          <div className="flex items-center gap-1 text-[10px] text-adf-success">
                            <Clock className="w-3 h-3" />
                            2-5 jours
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-adf-darker/90 border-t border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          <NavItem icon={HomeIcon} label="Accueil" href="/" />
          <NavItem icon={MessageSquareIcon} label="ADF IA" href="/chat" />
          <NavItem icon={Briefcase} label="Services" href="/services" active />
          <NavItem icon={ShoppingBagIcon} label="Boutique" href="/store" />
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
function ShoppingBagIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>; }
function UserIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
