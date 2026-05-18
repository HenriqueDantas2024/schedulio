import DashboardCards from "./DashboardCards";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>Bem-vindo ao Grade Horária</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>IMP Concursos — Painel de Coordenação</p>
      </div>
      <DashboardCards />
    </div>
  );
}
