const prisma = require("../lib/prisma");
const { HttpError } = require("../lib/HttpError");
const asyncHandler = require("../lib/asyncHandler");

const toSetData = (s, i) => ({
  exerciseName: String(s.exerciseName).trim(),
  muscle: s.muscle,
  weight: Number(s.weight),
  reps: Number(s.reps),
  setNumber: Number.isInteger(s.setNumber) ? s.setNumber : i + 1,
});

const list = asyncHandler(async (req, res) => {
  res.json(
    await prisma.workoutSession.findMany({
      where: { userId: req.userId },
      include: { sets: { orderBy: { setNumber: "asc" } } },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    })
  );
});

const create = asyncHandler(async (req, res) => {
  const { date, sets } = req.body;
  const session = await prisma.workoutSession.create({
    data: { date: new Date(date), userId: req.userId, sets: { create: sets.map(toSetData) } },
    include: { sets: true },
  });
  res.status(201).json(session);
});

// Importación masiva (Ajustes > Importar Excel). Todo o nada: si algo falla no se guarda nada.
const bulkCreate = asyncHandler(async (req, res) => {
  const { sessions } = req.body;
  const created = await prisma.$transaction(
    sessions.map((s) =>
      prisma.workoutSession.create({
        data: { date: new Date(s.date), userId: req.userId, sets: { create: s.sets.map(toSetData) } },
      })
    )
  );
  res.status(201).json({ imported: created.length });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.workoutSession.deleteMany({ where: { id: req.params.id, userId: req.userId } });
  if (result.count === 0) throw new HttpError(404, "Sesión no encontrada.", "NOT_FOUND");
  res.status(204).send();
});

const removeAll = asyncHandler(async (req, res) => {
  await prisma.workoutSession.deleteMany({ where: { userId: req.userId } });
  res.status(204).send();
});

module.exports = { list, create, bulkCreate, remove, removeAll };
