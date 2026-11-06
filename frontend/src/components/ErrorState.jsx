import { RefreshCw, TriangleAlert } from "lucide-react";

// Bloque de error con botón de reintentar, para pantallas que no pudieron cargar sus datos
export default function ErrorState({ message, onRetry, title = "No se pudo cargar", children }) {
  return (
    <div role="alert" className="max-w-md mx-auto text-center glass-card rounded-2xl p-8 my-10">
      <span className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-danger/15 text-danger mb-4">
        <TriangleAlert size={28} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-5">{message}</p>
      <div className="flex justify-center gap-3">
        {onRetry && (
          <button onClick={onRetry} className="btn-primary text-sm">
            <RefreshCw size={16} aria-hidden="true" /> Reintentar
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

// Banner compacto para errores dentro de formularios
export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 bg-danger/15 text-red-300 text-sm rounded-lg p-3 mb-4">
      <TriangleAlert size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
