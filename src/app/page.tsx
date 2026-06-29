"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ShoppingBag,
  Briefcase,
  User,
  Sparkles,
  ChevronRight,
  Zap,
  Globe,
  Shield,
  Download,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const features = [
  {
    icon: Sparkles,
    title: "ADF IA",
    desc: "Assistant intelligent pour vos besoins digitaux",
    href: "/chat",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: Briefcase,
    title: "Services",
    desc: "Commandez des services digitaux professionnels",
    href: "/services",
    color: "from-blue-400 to-indigo-500",
  },
  {
    icon: ShoppingBag,
    title: "Boutique",
    desc: "Achetez des produits digitaux exclusifs",
    href: "/store",
    color: "from-indigo-400 to-purple-500",
  },
];

const stats = [
  { icon: Zap, value: "500+", label: "Projets livrés" },
  { icon: Globe, value: "50+", label: "Clients satisfaits" },
  { icon: Shield, value: "100%", label: "Sécurisé" },
];

export default function HomePage() {
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowInstall(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-adf-darker/80 border-b border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center adf-glow">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight adf-gradient-text">ADF</h1>
              <p className="text-[10px] text-adf-text-muted">Arafat Digital Futurist</p>
            </div>
          </div>
          {user ? (
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-adf-card border border-adf-border flex items-center justify-center hover:border-adf-blue/50 transition-colors"
            >
              <User className="w-5 h-5 text-adf-blue" />
            </Link>
          ) : (
            <Link
              href="/auth"
              className="w-10 h-10 rounded-xl bg-adf-card border border-adf-border flex items-center justify-center hover:border-adf-blue/50 transition-colors"
            >
              <LogIn className="w-5 h-5 text-adf-blue" />
            </Link>
          )}
        </div>
      </header>

      <section className="max-w-lg mx-auto px-4 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-adf-blue/10 border border-adf-blue/20 mb-6">
            <Sparkles className="w-4 h-4 text-adf-cyan" />
            <span className="text-sm text-adf-blue-light">L&apos;avenir du digital</span>
          </div>
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            Votre partenaire <span className="adf-gradient-text">digital futuriste</span>
          </h2>
          <p className="text-adf-text-muted text-sm leading-relaxed mb-6">
            Conçue par le PDG d&apos;ADF — Arafat Digital Futurist, M. Arafat Garga
          </p>
          {user && profile && (
            <p className="text-sm text-adf-blue mb-4">
              Bienvenue, {profile.full_name || profile.email}!
            </p>
          )}
        </motion.div>

        {showInstall && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleInstall}
            className="w-full adf-btn flex items-center justify-center gap-2 mb-6"
          >
            <Download className="w-5 h-5" />
            Installer l&apos;application ADF
          </motion.button>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="adf-card p-4 text-center"
            >
              <stat.icon className="w-5 h-5 text-adf-blue mx-auto mb-2" />
              <div className="text-lg font-bold adf-gradient-text">{stat.value}</div>
              <div className="text-[10px] text-adf-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <Link href={feature.href}>
                <div className="adf-card p-4 flex items-center gap-4 hover:border-adf-blue/40 transition-all group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center adf-glow group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-adf-text">{feature.title}</h3>
                    <p className="text-xs text-adf-text-muted">{feature.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-adf-text-muted group-hover:text-adf-blue transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="adf-card p-5 text-center">
          <h3 className="font-semibold mb-2 adf-gradient-text">Qui sommes-nous ?</h3>
          <p className="text-sm text-adf-text-muted leading-relaxed">
            ADF est une entreprise digitale innovante fondée par M. Arafat Garga,
            spécialisée dans la création de solutions digitales de pointe :
            design graphique, développement web, intelligence artificielle et
            bien plus encore.
          </p>
        </motion.div>

        {user && (
          <button
            onClick={signOut}
            className="w-full mt-6 adf-btn-secondary text-sm flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Se déconnecter
          </button>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-adf-darker/90 border-t border-adf-border">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          <NavItem icon={Sparkles} label="Accueil" href="/" active />
          <NavItem icon={MessageSquare} label="ADF IA" href="/chat" />
          <NavItem icon={Briefcase} label="Services" href="/services" />
          <NavItem icon={ShoppingBag} label="Boutique" href="/store" />
          <NavItem icon={User} label="Profil" href={user ? "/dashboard" : "/auth"} />
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
