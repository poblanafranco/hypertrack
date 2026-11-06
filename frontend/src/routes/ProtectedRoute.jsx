import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { PageLoader } from "../components/Spinner.jsx";
import ErrorState from "../components/ErrorState.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, sessionError, retry, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }
  if (sessionError) {
    return (
      <div className="h-[100dvh] flex items-center justify-center px-4">
        <ErrorState title="No hay conexión con el servidor" message={sessionError} onRetry={retry}>
          <button onClick={logout} className="btn-ghost">
            Cerrar sesión
          </button>
        </ErrorState>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
