// Las sesiones se guardan como fecha (sin hora) a medianoche UTC. Se muestran en UTC para que
// "24 de septiembre" no aparezca como "23" en zonas horarias al oeste de Greenwich (México).
export function formatSessionDate(iso, options) {
  return new Date(iso).toLocaleDateString("es-MX", { timeZone: "UTC", ...options });
}

// Fecha de hoy en la zona horaria LOCAL, formato YYYY-MM-DD (toISOString daría la de UTC y a partir de las 6 pm en México ya sería "mañana")
export function todayLocalISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Días completos transcurridos desde una fecha de sesión hasta hoy (calendario local)
export function daysSince(iso) {
  const s = new Date(iso);
  const start = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - start) / 86400000));
}
