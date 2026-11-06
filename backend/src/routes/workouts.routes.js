const { Router } = require("express");
const { body, param } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { MUSCLES } = require("../utils/constants");
const { list, create, bulkCreate, remove, removeAll } = require("../controllers/workoutController");

const router = Router();
router.use(requireAuth);

// Reglas reutilizables para los sets; `prefix` es "sets" o "sessions.*.sets"
const setRules = (prefix) => [
  body(`${prefix}.*.exerciseName`)
    .trim()
    .notEmpty().withMessage("Cada set necesita el nombre del ejercicio.")
    .isLength({ max: 100 }).withMessage("El nombre del ejercicio no puede pasar de 100 caracteres."),
  body(`${prefix}.*.muscle`).isIn(MUSCLES).withMessage("Hay un set con un grupo muscular inválido."),
  body(`${prefix}.*.weight`).isFloat({ min: 0, max: 2000 }).withMessage("El peso debe estar entre 0 y 2000 kg."),
  body(`${prefix}.*.reps`).isInt({ min: 1, max: 1000 }).withMessage("Las repeticiones deben ser un entero entre 1 y 1000."),
];

router.get("/", list);

router.post(
  "/",
  [
    body("date").isISO8601().withMessage("La fecha no es válida."),
    body("sets").isArray({ min: 1, max: 200 }).withMessage("Debe incluir entre 1 y 200 sets."),
    ...setRules("sets"),
  ],
  validate,
  create
);

router.post(
  "/bulk",
  [
    body("sessions").isArray({ min: 1, max: 500 }).withMessage("Se esperaba una lista de 1 a 500 sesiones."),
    body("sessions.*.date").isISO8601().withMessage("Hay una sesión con fecha inválida."),
    body("sessions.*.sets").isArray({ min: 1, max: 200 }).withMessage("Cada sesión debe incluir entre 1 y 200 sets."),
    ...setRules("sessions.*.sets"),
  ],
  validate,
  bulkCreate
);

router.delete("/all/clear", removeAll);
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("El identificador no es válido.").toInt()],
  validate,
  remove
);

module.exports = router;
