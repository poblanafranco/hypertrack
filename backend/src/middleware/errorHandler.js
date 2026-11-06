const { Prisma } = require("@prisma/client");
const { HttpError } = require("../lib/HttpError");
const { isConnectionError, isSchemaError, explainDbError } = require("../lib/dbErrors");

function notFound(req, res) {
  res.status(404).json({ error: "Ruta no encontrada.", code: "NOT_FOUND" });
}

// Middleware centralizado: TODA respuesta de error sale con la forma { error, code, details? }
// y nunca filtra rutas de archivos, SQL ni mensajes internos al cliente.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Si ya se empezó a responder, delega en Express
  if (res.headersSent) return next(err);

  // 1) Errores controlados
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code, details: err.details });
  }

  // 2) Errores de body-parser (JSON roto, cuerpo enorme)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido.", code: "BAD_JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "La petición es demasiado grande.", code: "PAYLOAD_TOO_LARGE" });
  }

  // 3) Base de datos inaccesible o sin migrar: 503 (servicio no disponible), detalle solo en la terminal
  if (isConnectionError(err)) {
    console.error(explainDbError(err));
    return res.status(503).json({
      error: "No se pudo conectar con la base de datos. Intenta de nuevo en unos minutos.",
      code: "DB_UNAVAILABLE",
    });
  }
  if (isSchemaError(err)) {
    console.error(explainDbError(err));
    return res.status(503).json({
      error: "La base de datos no está lista todavía (faltan migraciones).",
      code: "DB_NOT_MIGRATED",
    });
  }

  // 4) Errores conocidos de consultas Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = [].concat(err.meta?.target || []).join(",");
        const msg = target.includes("email")
          ? "Ya existe una cuenta con ese correo."
          : "Ese registro ya existe.";
        return res.status(409).json({ error: msg, code: "DUPLICATE" });
      }
      case "P2025":
        return res.status(404).json({ error: "Recurso no encontrado.", code: "NOT_FOUND" });
      case "P2003":
        return res.status(409).json({
          error: "La operación referencia un dato que ya no existe. Vuelve a iniciar sesión.",
          code: "BAD_REFERENCE",
        });
      case "P2000":
        return res.status(400).json({ error: "Alguno de los valores es demasiado largo.", code: "VALUE_TOO_LONG" });
      default:
        break;
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error(err);
    return res.status(400).json({ error: "Los datos enviados no tienen el formato esperado.", code: "BAD_DATA" });
  }

  // 5) Cualquier otra cosa: se registra completa en el servidor y el cliente recibe un mensaje genérico
  console.error(err);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message =
    status < 500 && err.expose ? err.message : "Ocurrió un error interno del servidor. Intenta de nuevo.";
  res.status(status).json({ error: message, code: "INTERNAL_ERROR" });
}

module.exports = { errorHandler, notFound };
