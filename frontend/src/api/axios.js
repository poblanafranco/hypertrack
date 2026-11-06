import axios from "axios";

// Por defecto "/api": en desarrollo Vite lo redirige al backend y en Docker lo hace nginx.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
});

export const TOKEN_KEY = "hypertrack_token";
export const UNAUTHORIZED_EVENT = "hypertrack:unauthorized";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthForm = url.includes("/auth/login") || url.includes("/auth/register");
    // Sesión vencida o inválida en cualquier pantalla protegida: avisa a AuthContext para sacar al usuario
    if (err.response?.status === 401 && !isAuthForm && localStorage.getItem(TOKEN_KEY)) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(err);
  }
);

export default api;
