require("dotenv").config();
const express = require("express");
const cors = require("cors");

const prisma = require("./lib/prisma");
const { HttpError } = require("./lib/HttpError");
const asyncHandler = require("./lib/asyncHandler");
const authRoutes = require("./routes/auth.routes");
const routineRoutes = require("./routes/routine.routes");
const workoutRoutes = require("./routes/workouts.routes");
const exerciseRoutes = require("./routes/exercises.routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");

// CORS_ORIGIN acepta varios orígenes separados por coma ("*" permite cualquiera)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Sin Origin = peticiones de servidor a servidor, curl, tests, o el proxy del frontend
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new HttpError(403, `Origen no permitido por CORS: ${origin}`, "CORS_BLOCKED"));
    },
  })
);
app.use(express.json({ limit: "2mb" }));

// Liveness: el proceso responde
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Readiness: además la base de datos responde (lo usa el healthcheck de Docker)
app.get(
  "/api/health/db",
  asyncHandler(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up" });
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/routine", routineRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/exercises", exerciseRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
