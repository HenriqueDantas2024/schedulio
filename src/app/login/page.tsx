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
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-background)" }}>

      {/* ── Painel Esquerdo — Marca ───────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0F1D54 0%, #1A2D7A 50%, #1a5f6e 85%, #2BBFAA 100%)" }}
      >
        {/* Logo marca d'água */}
        <img
          src="/schedulio-logo.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-20px",
            right: "-40px",
            width: "460px",
            opacity: 0.18,
            mixBlendMode: "screen",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        {/* Wordmark */}
        <div>
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(90deg, #fff 30%, #2BBFAA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px",
            }}
          >
            schedulio
          </span>
        </div>

        {/* Conteúdo central */}
        <div>
          <h1
            className="text-5xl font-extrabold leading-tight mb-6"
            style={{ color: "#fff", letterSpacing: "-1.5px" }}
          >
            Chega de<br />
            <span style={{
              background: "linear-gradient(90deg, #7DD8CC 0%, #2BBFAA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>planilha.</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 380 }}>
            Gerencie professores, turmas e grade horária em um único lugar. Simples, rápido e sem dor de cabeça.
          </p>
        </div>

        {/* Rodapé do painel */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-px" style={{ backgroundColor: "rgba(255,255,255,0.25)" }} />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Schedulio · Gestão educacional inteligente
          </p>
        </div>
      </div>

      {/* ── Painel Direito — Formulário ───────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Logo mobile (só aparece em telas menores) */}
          <div className="lg:hidden text-center mb-10">
            <img
              src="/schedulio-logo.png"
              alt="Schedulio"
              className="h-14 w-auto mx-auto object-contain"
            />
          </div>

          {/* Cabeçalho do formulário */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: "var(--color-navy)", letterSpacing: "-0.5px" }}>
              Bem-vindo de volta
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Acesso restrito à coordenação
            </p>
          </div>

          {/* Formulário */}
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
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
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
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  border: "1.5px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
              />
            </div>

            {error && (
              <p className="text-sm text-center rounded-lg py-2" style={{ color: "var(--color-error)", backgroundColor: "#FEF2F2" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all mt-1"
              style={{
                background: loading ? "var(--color-text-muted)" : "linear-gradient(135deg, #1D40B0 0%, #2BBFAA 100%)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
                boxShadow: loading ? "none" : "0 4px 20px rgba(29, 64, 176, 0.35)",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}
