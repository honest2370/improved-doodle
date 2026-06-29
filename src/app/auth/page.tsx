"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else router.push("/");
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
      else {
        setError("Compte créé ! Vérifiez votre email, puis connectez-vous.");
        setMode("login");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 adf-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold adf-gradient-text">ADF</h1>
          <p className="text-sm text-adf-text-muted mt-1">
            {mode === "login" ? "Connectez-vous" : "Créez votre compte"}
          </p>
        </div>

        <div className="adf-card p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-adf-blue/20 text-adf-blue border border-adf-blue/30"
                  : "text-adf-text-muted"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-adf-blue/20 text-adf-blue border border-adf-blue/30"
                  : "text-adf-text-muted"
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-adf-text-muted mb-1 block">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-adf-text-muted" />
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="adf-input w-full pl-10 text-sm"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-adf-text-muted mb-1 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-adf-text-muted" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@email.com"
                  className="adf-input w-full pl-10 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-adf-text-muted mb-1 block">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-adf-text-muted" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="adf-input w-full pl-10 text-sm"
                />
              </div>
            </div>

            {error && (
              <p className={`text-xs text-center ${error.includes("créé") || error.includes("Vérifiez") ? "text-adf-success" : "text-adf-danger"}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full adf-btn flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-adf-dark/30 border-t-adf-dark rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Se connecter" : "S'inscrire"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-adf-text-muted mt-6">
          Conçue par le PDG d&apos;ADF — M. Arafat Garga
        </p>
      </motion.div>
    </div>
  );
}
