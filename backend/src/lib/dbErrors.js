const { Prisma } = require("@prisma/client");

// Códigos de Prisma que significan "no pude hablar con la base de datos"
const CONNECTION_CODES = ["P1000", "P1001", "P1002", "P1003", "P1008", "P1017"];
// Códigos que significan "la BD existe pero le faltan tablas/columnas (migraciones sin aplicar)"
const SCHEMA_CODES = ["P2021", "P2022"];

function isConnectionError(err) {
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    (err instanceof Prisma.PrismaClientKnownRequestError && CONNECTION_CODES.includes(err.code))
  );
}

function isSchemaError(err) {
  return err instanceof Prisma.PrismaClientKnownRequestError && SCHEMA_CODES.includes(err.code);
}

// Mensaje pensado para la persona que desarrolla (sale en la terminal del backend, nunca en la respuesta HTTP)
function explainDbError(err) {
  const text = String(err && err.message ? err.message : err);

  if (isSchemaError(err)) {
    return [
      "[BD] La base de datos responde, pero le faltan tablas.",
      "     Solución: en la carpeta backend ejecuta  npx prisma migrate deploy",
    ].join("\n");
  }
  if (/Authentication failed|P1000/i.test(text)) {
    return [
      "[BD] PostgreSQL rechazó el usuario o la contraseña de DATABASE_URL.",
      "     Causas típicas:",
      "       1) Hay OTRO PostgreSQL instalado en Windows usando el puerto 5432 y Prisma se está conectando a ese.",
      "          Solución: usa el puerto 5433 (el de Docker) en backend/.env  ->  ...@localhost:5433/hypertrack",
      "       2) Usuario/contraseña distintos a los del docker-compose.yml (hypertrack / hypertrack).",
      "       3) Cambiaste las credenciales del compose pero el volumen viejo conserva las anteriores:",
      "          docker compose down -v   y vuelve a levantar la base.",
    ].join("\n");
  }
  if (/Can't reach database server|P1001|ECONNREFUSED/i.test(text)) {
    return [
      "[BD] No se pudo conectar al servidor PostgreSQL.",
      "     Solución: levanta la base con  docker compose up -d db  y revisa el puerto de DATABASE_URL (5433).",
    ].join("\n");
  }
  if (/Environment variable not found: DATABASE_URL/i.test(text)) {
    return "[BD] Falta DATABASE_URL. Copia backend/.env.example a backend/.env.";
  }
  return `[BD] Error de base de datos: ${text.split("\n").pop()}`;
}

module.exports = { isConnectionError, isSchemaError, explainDbError };
