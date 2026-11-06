const { Router } = require("express");
const { body } = require("express-validator");
const { register, login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = Router();

const email = body("email").trim().toLowerCase().isEmail().withMessage("Escribe un correo válido.");

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty().withMessage("El nombre es obligatorio.")
      .isLength({ max: 60 }).withMessage("El nombre no puede pasar de 60 caracteres."),
    email,
    body("password")
      .isString().withMessage("La contraseña es obligatoria.")
      .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres.")
      .isLength({ max: 72 }).withMessage("La contraseña no puede pasar de 72 caracteres."),
  ],
  validate,
  register
);

router.post(
  "/login",
  [email, body("password").isString().notEmpty().withMessage("La contraseña es obligatoria.")],
  validate,
  login
);

router.get("/me", requireAuth, me);

module.exports = router;
