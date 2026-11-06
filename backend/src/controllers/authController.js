const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signToken } = require("../lib/jwt");
const { HttpError } = require("../lib/HttpError");
const asyncHandler = require("../lib/asyncHandler");

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "Ya existe una cuenta con ese correo.", "DUPLICATE");

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hashed } });

  res.status(201).json({ token: signToken({ userId: user.id }), user: publicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.password) : false;
  if (!valid) throw new HttpError(401, "Correo o contraseña incorrectos.", "BAD_CREDENTIALS");

  res.json({ token: signToken({ userId: user.id }), user: publicUser(user) });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) throw new HttpError(401, "Sesión inválida. Inicia sesión de nuevo.", "SESSION_INVALID");
  res.json(user);
});

module.exports = { register, login, me };
