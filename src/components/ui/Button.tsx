import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export default function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center gap-2 font-semibold rounded-lg transition-all cursor-pointer";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "text-white",
    ghost: "border",
    danger: "text-white",
  };

  const styles = {
    primary: { backgroundColor: "var(--color-primary)" },
    ghost: { backgroundColor: "transparent", borderColor: "var(--color-border)", color: "var(--color-text-primary)" },
    danger: { backgroundColor: "var(--color-error)" },
  };

  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  );
}
