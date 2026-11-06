const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

afterAll(() => prisma.$disconnect());

describe("Salud y errores generales", () => {
  it("GET /api/health responde ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/health/db confirma que la base responde", async () => {
    const res = await request(app).get("/api/health/db");
    expect(res.status).toBe(200);
    expect(res.body.database).toBe("up");
  });

  it("devuelve 404 en JSON para rutas inexistentes", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("devuelve 400 en JSON si el cuerpo no es JSON válido", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{esto no es json");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_JSON");
  });
});
