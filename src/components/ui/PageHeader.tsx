interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>{title}</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{description}</p>
      </div>
      {action}
    </div>
  );
}
