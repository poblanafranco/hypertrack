const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const testUser = {
  name: "Usuario de Prueba",
  email: `test-${Date.now()}@hypertrack.com`,
  password: "clave12345",
};

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("Autenticación", () => {
  it("registra un usuario nuevo y devuelve un token", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rechaza el registro duplicado con el mismo correo (aunque cambien las mayúsculas)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...testUser, email: testUser.email.toUpperCase() });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  it("inicia sesión con credenciales correctas", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("rechaza login con contraseña incorrecta", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: testUser.email, password: "incorrecta" });
    expect(res.status).toBe(401);
  });

  it("rechaza login con un correo que no existe (mismo mensaje, sin revelar nada)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nadie@hypertrack.com", password: "clave12345" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Correo o contraseña incorrectos.");
  });

  it("rechaza registro con correo inválido y explica el motivo", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "X", email: "no-es-un-correo", password: "clave12345" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.details[0].field).toBe("email");
  });

  it("rechaza contraseñas de menos de 6 caracteres", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "X", email: "otro@hypertrack.com", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 caracteres/);
  });

  it("GET /me con token inválido devuelve 401", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer basura");
    expect(res.status).toBe(401);
  });
});
