import { Loader2 } from "lucide-react";

export function Spinner({ size = 18, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function PageLoader({ label = "Cargando…" }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 text-gray-400 py-16">
      <Spinner size={22} className="text-primary" />
      <span>{label}</span>
    </div>
  );
}
