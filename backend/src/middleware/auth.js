const { verifyToken } = require("../lib/jwt");
const prisma = require("../lib/prisma");
const { HttpError } = require("../lib/HttpError");
const asyncHandler = require("../lib/asyncHandler");

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Necesitas iniciar sesión.", "NO_TOKEN");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new HttpError(401, "Tu sesión expiró. Inicia sesión de nuevo.", "TOKEN_EXPIRED");
    }
    throw new HttpError(401, "Sesión inválida. Inicia sesión de nuevo.", "TOKEN_INVALID");
  }

  // El usuario pudo haberse borrado (por ejemplo, al reiniciar la base de datos)
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true } });
  if (!user) {
    throw new HttpError(401, "Sesión inválida. Inicia sesión de nuevo.", "SESSION_INVALID");
  }

  req.userId = user.id;
  next();
});

module.exports = { requireAuth };
