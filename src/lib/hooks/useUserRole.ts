"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "coordenador" | "diretor" | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("perfis")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole((data?.role as UserRole) ?? "coordenador");
      setLoading(false);
    }

    fetchRole();
  }, []);

  return { role, loading };
}
