"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-background)" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl font-extrabold" style={{ color: "var(--color-primary)" }}>imp</span>
            <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>concursos</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Grade Horária</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Acesso restrito à coordenação</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-lg" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              />
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "var(--color-error)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all"
              style={{
                backgroundColor: loading ? "var(--color-text-muted)" : "var(--color-primary)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "var(--color-primary-hover)"; }}
              onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "var(--color-primary)"; }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
