interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</label>
      <input
        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
        style={{
          border: `1.5px solid ${error ? "var(--color-error)" : "var(--color-border)"}`,
          backgroundColor: "var(--color-background)",
          color: "var(--color-text-primary)",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
        onBlur={(e) => e.target.style.borderColor = error ? "var(--color-error)" : "var(--color-border)"}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>}
    </div>
  );
}
