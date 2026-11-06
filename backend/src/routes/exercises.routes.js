const { Router } = require("express");
const { query } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { suggestions } = require("../controllers/exerciseController");

const router = Router();
router.use(requireAuth);

router.get("/suggestions", [query("muscle").trim().notEmpty().withMessage("Falta el parámetro 'muscle'.")], validate, suggestions);

module.exports = router;
