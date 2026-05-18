import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TurmaDetailClient from "./TurmaDetailClient";

export default async function TurmaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: turma } = await supabase
    .from("turmas")
    .select("*")
    .eq("id", id)
    .single();

  if (!turma) notFound();

  return <TurmaDetailClient turma={turma} />;
}
