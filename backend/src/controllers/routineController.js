const prisma = require("../lib/prisma");
const { HttpError } = require("../lib/HttpError");
const asyncHandler = require("../lib/asyncHandler");

const listActive = asyncHandler(async (req, res) => {
  res.json(
    await prisma.routineEntry.findMany({
      where: { userId: req.userId, archived: false },
      orderBy: { createdAt: "asc" },
    })
  );
});

const listArchived = asyncHandler(async (req, res) => {
  res.json(
    await prisma.routineEntry.findMany({
      where: { userId: req.userId, archived: true },
      orderBy: { createdAt: "desc" },
    })
  );
});

const create = asyncHandler(async (req, res) => {
  const { day, muscle, name } = req.body;
  const entry = await prisma.routineEntry.create({ data: { day, muscle, name, userId: req.userId } });
  res.status(201).json(entry);
});

function setArchived(archived) {
  return asyncHandler(async (req, res) => {
    const result = await prisma.routineEntry.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { archived },
    });
    if (result.count === 0) throw new HttpError(404, "Ejercicio no encontrado.", "NOT_FOUND");
    res.json({ ok: true });
  });
}

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.routineEntry.deleteMany({ where: { id: req.params.id, userId: req.userId } });
  if (result.count === 0) throw new HttpError(404, "Ejercicio no encontrado.", "NOT_FOUND");
  res.status(204).send();
});

module.exports = { listActive, listArchived, create, archive: setArchived(true), restore: setArchived(false), remove };
