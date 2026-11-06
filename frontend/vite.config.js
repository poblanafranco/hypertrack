import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dónde está el backend en desarrollo (npm run dev). El navegador SIEMPRE habla con "/api" del mismo origen,
  // así que no hay CORS ni puertos que mantener sincronizados en el frontend.
  const target = env.VITE_PROXY_TARGET || "http://localhost:4000";

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true, // si el 5173 está ocupado, avisa en lugar de saltar a otro puerto en silencio
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          configure(proxy) {
            // Si el backend está apagado, responde un JSON claro en vez de un 500 vacío
            proxy.on("error", (err, req, res) => {
              if (!res || typeof res.writeHead !== "function" || res.headersSent) return;
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error: `El backend no responde en ${target}. Inícialo con "npm run dev" dentro de la carpeta backend.`,
                  code: "BACKEND_DOWN",
                })
              );
            });
          },
        },
      },
    },
  };
});
