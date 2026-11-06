import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { TOKEN_KEY, UNAUTHORIZED_EVENT } from "../api/axios";
import { getErrorMessage, isServerDown } from "../utils/errors.js";
import { useToast } from "../components/Toast.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));
  // Error de conectividad al restaurar la sesión: NO se cierra la sesión, se ofrece reintentar
  const [sessionError, setSessionError] = useState("");

  const restoreSession = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setSessionError("");
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      if (isServerDown(err)) setSessionError(getErrorMessage(err));
      else localStorage.removeItem(TOKEN_KEY); // token vencido o de un usuario que ya no existe
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Cualquier petición que reciba 401 (sesión vencida) saca al usuario a /login con un aviso
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      toast.info("Tu sesión expiró. Inicia sesión de nuevo.");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [toast]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setSessionError("");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionError, login, register, logout, retry: restoreSession }),
    [user, loading, sessionError, login, register, logout, restoreSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
