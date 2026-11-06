import axios from "axios";

// Convierte cualquier error (red, timeout, validación, servidor caído…) en un mensaje entendible.
export function getErrorMessage(err, fallback = "Ocurrió un error inesperado. Intenta de nuevo.") {
  if (axios.isCancel(err)) return "";
  if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
    return "El servidor tardó demasiado en responder. Intenta de nuevo.";
  }
  if (!err?.response) {
    return "No se pudo conectar con el servidor. Revisa que el backend esté corriendo y tu conexión a internet.";
  }
  const { status, data } = err.response;
  if (typeof data?.error === "string" && data.error) return data.error;
  if (status === 413) return "El archivo o los datos son demasiado grandes.";
  if (status === 429) return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  if (status === 502 || status === 503 || status === 504) {
    return "El servidor no está disponible en este momento. Intenta de nuevo en unos segundos.";
  }
  if (status >= 500) return "El servidor tuvo un problema. Intenta de nuevo en un momento.";
  return fallback;
}

// Errores por campo que manda el backend: { details: [{ field, message }] } -> { email: "…", password: "…" }
export function getFieldErrors(err) {
  const details = err?.response?.data?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce((acc, d) => {
    if (d.field && !acc[d.field]) acc[d.field] = d.message;
    return acc;
  }, {});
}

// ¿Es un problema de conectividad/servidor (y no de la sesión o de los datos)?
export function isServerDown(err) {
  return !err?.response || err.response.status >= 500;
}
