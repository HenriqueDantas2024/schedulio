import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-background)" }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>
          Grade Horária IMP
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          ✅ Autenticação funcionando — Fase 01 completa!
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          {user.email}
        </p>
      </div>
    </div>
  );
}
