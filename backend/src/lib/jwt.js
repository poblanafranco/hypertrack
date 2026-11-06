const jwt = require("jsonwebtoken");

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET es obligatorio en producción.");
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-inseguro-cambiar";
if (!process.env.JWT_SECRET) {
  console.warn("[Seguridad] JWT_SECRET no está definido: se usa un secreto de desarrollo. Defínelo en backend/.env.");
}
const EXPIRES_IN = "7d";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_SECRET };
