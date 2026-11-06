import { Component } from "react";
import { TriangleAlert } from "lucide-react";

// Última red de seguridad: si un componente revienta al renderizar, no se queda la pantalla en negro
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Error de interfaz:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-[100dvh] flex items-center justify-center bg-darker px-4">
        <div className="max-w-sm text-center glass-card rounded-2xl p-8">
          <span className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-danger/15 text-danger mb-4">
            <TriangleAlert size={28} aria-hidden="true" />
          </span>
          <h1 className="text-lg font-bold mb-1">Algo salió mal en la pantalla</h1>
          <p className="text-sm text-gray-400 mb-5">Tus datos están a salvo. Recarga la página para continuar.</p>
          <button onClick={() => window.location.assign("/")} className="btn-primary text-sm">
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
