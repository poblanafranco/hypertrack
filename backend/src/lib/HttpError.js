// Error controlado: el middleware de errores lo convierte en una respuesta JSON limpia
class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = { HttpError };
