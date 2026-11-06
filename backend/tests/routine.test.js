const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const testUser = {
  name: "Usuario Rutina",
  email: `routine-${Date.now()}@hypertrack.com`,
  password: "clave12345",
};

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  const res = await request(app).post("/api/auth/register").send(testUser);
  token = res.body.token;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe("Rutina (requiere autenticación)", () => {
  it("rechaza la petición sin token", async () => {
    const res = await request(app).get("/api/routine");
    expect(res.status).toBe(401);
  });

  it("crea, archiva, restaura y elimina un ejercicio", async () => {
    const created = await request(app).post("/api/routine").set(auth()).send({ day: "Lunes", muscle: "Pecho", name: "Press de banca" });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await request(app).get("/api/routine").set(auth());
    expect(list.status).toBe(200);
    expect(list.body.some((e) => e.id === id)).toBe(true);

    expect((await request(app).patch(`/api/routine/${id}/archive`).set(auth())).status).toBe(200);
    const archived = await request(app).get("/api/routine/archived").set(auth());
    expect(archived.body.some((e) => e.id === id)).toBe(true);

    expect((await request(app).patch(`/api/routine/${id}/restore`).set(auth())).status).toBe(200);
    expect((await request(app).delete(`/api/routine/${id}`).set(auth())).status).toBe(204);
    expect((await request(app).delete(`/api/routine/${id}`).set(auth())).status).toBe(404);
  });

  it("valida día, músculo y nombre", async () => {
    const res = await request(app).post("/api/routine").set(auth()).send({ day: "Funday", muscle: "Pecho", name: "X" });
    expect(res.status).toBe(400);
    const res2 = await request(app).post("/api/routine").set(auth()).send({ day: "Lunes", muscle: "Pecho", name: "   " });
    expect(res2.status).toBe(400);
  });

  it("rechaza ids que no son números", async () => {
    const res = await request(app).delete("/api/routine/abc").set(auth());
    expect(res.status).toBe(400);
  });
});

describe("Entrenamientos", () => {
  const set = { exerciseName: "Sentadilla", muscle: "Pierna", weight: 80, reps: 8 };

  it("guarda una sesión y la lista", async () => {
    const res = await request(app).post("/api/workouts").set(auth()).send({ date: "2026-09-24", sets: [set] });
    expect(res.status).toBe(201);
    const list = await request(app).get("/api/workouts").set(auth());
    expect(list.body).toHaveLength(1);
    expect(list.body[0].sets[0].exerciseName).toBe("Sentadilla");
  });

  it("rechaza sets inválidos con un mensaje útil", async () => {
    const res = await request(app).post("/api/workouts").set(auth()).send({ date: "2026-09-24", sets: [{ ...set, reps: 0 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/repeticiones/);
  });

  it("rechaza fecha inválida y sesiones sin sets", async () => {
    expect((await request(app).post("/api/workouts").set(auth()).send({ date: "ayer", sets: [set] })).status).toBe(400);
    expect((await request(app).post("/api/workouts").set(auth()).send({ date: "2026-09-24", sets: [] })).status).toBe(400);
  });

  it("importa varias sesiones de golpe y valida cada una", async () => {
    const ok = await request(app)
      .post("/api/workouts/bulk")
      .set(auth())
      .send({ sessions: [{ date: "2026-09-20", sets: [set] }, { date: "2026-09-21", sets: [set, set] }] });
    expect(ok.status).toBe(201);
    expect(ok.body.imported).toBe(2);

    const bad = await request(app)
      .post("/api/workouts/bulk")
      .set(auth())
      .send({ sessions: [{ date: "2026-09-22", sets: [{ ...set, weight: -5 }] }] });
    expect(bad.status).toBe(400);
  });

  it("borra todos los registros del usuario", async () => {
    expect((await request(app).delete("/api/workouts/all/clear").set(auth())).status).toBe(204);
    const list = await request(app).get("/api/workouts").set(auth());
    expect(list.body).toHaveLength(0);
  });
});
