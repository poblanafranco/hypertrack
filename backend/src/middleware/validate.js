const { validationResult } = require("express-validator");

// Corta la petición con 400 si alguna regla de express-validator falló.
// `error` trae el primer mensaje (listo para mostrarse) y `details` el detalle por campo.
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({
    error: details[0].message,
    code: "VALIDATION_ERROR",
    details,
  });
}

module.exports = { validate };
