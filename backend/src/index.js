const app = require("./app");
const prisma = require("./lib/prisma");
const { explainDbError } = require("./lib/dbErrors");

const PORT = Number(process.env.PORT) || 4000;

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Base de datos conectada correctamente.");
  } catch (err) {
    // No se tumba el servidor: la API responderá 503 con un mensaje claro hasta que la BD esté disponible
    console.error("\n" + explainDbError(err) + "\n");
  }
}

const server = app.listen(PORT, () => {
  console.log(`HyperTrack API escuchando en http://localhost:${PORT}`);
  checkDatabase();
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nEl puerto ${PORT} ya está ocupado (probablemente otro backend o un contenedor de Docker).\n` +
        `  Ver quién lo usa (Windows):  netstat -ano | findstr :${PORT}\n` +
        `  Cerrarlo:                    taskkill /PID <número> /F\n` +
        `  O usa otro puerto cambiando PORT en backend/.env\n`
    );
    process.exit(1);
  }
  throw err;
});

let closing = false;
function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`\n${signal} recibido, cerrando…`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Un error no capturado no debe dejar el proceso en un estado raro sin avisar
process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  shutdown("uncaughtException");
});
