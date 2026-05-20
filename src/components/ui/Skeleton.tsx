export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className ?? ""}`} style={style} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
      {/* Header */}
      <div className="flex gap-4 px-5 py-3" style={{ backgroundColor: "var(--color-background)", borderBottom: "1px solid var(--color-border)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} style={{ height: 12, flex: i === 0 ? 2 : 1, borderRadius: 4 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-4 items-center" style={{ borderBottom: r < rows - 1 ? "1px solid var(--color-border)" : "none" }}>
          <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton style={{ height: 13, width: "60%", borderRadius: 4 }} />
            <Skeleton style={{ height: 10, width: "40%", borderRadius: 4 }} />
          </div>
          {Array.from({ length: cols - 2 }).map((_, c) => (
            <Skeleton key={c} style={{ height: 12, flex: 1, borderRadius: 4 }} />
          ))}
          <div style={{ width: 64, display: "flex", gap: 6 }}>
            <Skeleton style={{ height: 28, width: 28, borderRadius: 8 }} />
            <Skeleton style={{ height: 28, width: 28, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div className="p-5 rounded-2xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <Skeleton style={{ height: 10, width: "50%", borderRadius: 4, marginBottom: 10 }} />
      <Skeleton style={{ height: 28, width: "70%", borderRadius: 6 }} />
    </div>
  );
}
