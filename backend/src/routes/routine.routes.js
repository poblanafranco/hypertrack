const { Router } = require("express");
const { body, param } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { DAYS, MUSCLES } = require("../utils/constants");
const { listActive, listArchived, create, archive, restore, remove } = require("../controllers/routineController");

const router = Router();
router.use(requireAuth);

const id = param("id").isInt({ min: 1 }).withMessage("El identificador no es válido.").toInt();

router.get("/", listActive);
router.get("/archived", listArchived);

router.post(
  "/",
  [
    body("day").isIn(DAYS).withMessage("Elige un día válido."),
    body("muscle").isIn(MUSCLES).withMessage("Elige un grupo muscular válido."),
    body("name")
      .trim()
      .notEmpty().withMessage("El nombre del ejercicio es obligatorio.")
      .isLength({ max: 100 }).withMessage("El nombre del ejercicio no puede pasar de 100 caracteres."),
  ],
  validate,
  create
);

router.patch("/:id/archive", [id], validate, archive);
router.patch("/:id/restore", [id], validate, restore);
router.delete("/:id", [id], validate, remove);

module.exports = router;
