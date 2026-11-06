import * as XLSX from "xlsx";
import { MUSCLES } from "./epley.js";

const pad = (n) => String(n).padStart(2, "0");
const REQUIRED_COLUMNS = ["fecha", "ejercicio", "musculo", "peso_kg", "reps"];

const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/s$/, ""); // "biceps" -> "bicep", "piernas" -> "pierna"

const MUSCLE_LOOKUP = Object.fromEntries(MUSCLES.map((m) => [normalize(m), m]));

function isRealDate(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Acepta: número de serie de Excel, "2026-09-24" o "24/09/2026". Devuelve "YYYY-MM-DD" o null.
export function toISODate(value) {
  let y, m, d;
  if (typeof value === "number") {
    const p = XLSX.SSF.parse_date_code(value);
    if (!p) return null;
    ({ y, m, d } = p);
  } else if (typeof value === "string") {
    const v = value.trim();
    let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) [y, m, d] = [+match[1], +match[2], +match[3]];
    else if ((match = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [d, m, y] = [+match[1], +match[2], +match[3]];
    else return null;
  } else {
    return null;
  }
  return isRealDate(y, m, d) ? `${y}-${pad(m)}-${pad(d)}` : null;
}

// Convierte las filas de la hoja en sesiones. Devuelve { sessions, errors } (errors indica la fila de Excel).
export function parseWorkoutRows(rows) {
  const errors = [];
  if (rows.length === 0) return { sessions: [], errors: ["El archivo no tiene filas de datos."] };

  const missing = REQUIRED_COLUMNS.filter((c) => !(c in rows[0]));
  if (missing.length) {
    return { sessions: [], errors: [`Faltan columnas: ${missing.join(", ")}. Usa el formato del botón «Exportar a Excel».`] };
  }

  const byDate = new Map();
  rows.forEach((r, i) => {
    const line = i + 2; // fila 1 = encabezados
    const fecha = toISODate(r.fecha);
    const muscle = MUSCLE_LOOKUP[normalize(r.musculo)];
    const name = String(r.ejercicio ?? "").trim();
    const weight = Number(r.peso_kg);
    const reps = Number(r.reps);

    if (!fecha) return errors.push(`Fila ${line}: fecha inválida (usa AAAA-MM-DD).`);
    if (!name) return errors.push(`Fila ${line}: falta el ejercicio.`);
    if (!muscle) return errors.push(`Fila ${line}: músculo «${r.musculo}» no reconocido (${MUSCLES.join(", ")}).`);
    if (!Number.isFinite(weight) || weight < 0 || weight > 2000) return errors.push(`Fila ${line}: peso inválido.`);
    if (!Number.isInteger(reps) || reps < 1 || reps > 1000) return errors.push(`Fila ${line}: repeticiones inválidas.`);

    if (!byDate.has(fecha)) byDate.set(fecha, []);
    const sets = byDate.get(fecha);
    sets.push({ exerciseName: name, muscle, weight, reps, setNumber: Number(r.set) > 0 ? Math.floor(Number(r.set)) : sets.length + 1 });
  });

  const sessions = [...byDate].map(([date, sets]) => ({ date, sets }));
  return { sessions, errors };
}

export function buildExportWorkbook(sessions) {
  const rows = [];
  sessions.forEach((session) => {
    session.sets.forEach((x) => {
      rows.push({
        fecha: new Date(session.date).toISOString().slice(0, 10),
        ejercicio: x.exerciseName,
        musculo: x.muscle,
        peso_kg: x.weight,
        reps: x.reps,
        set: x.setNumber,
      });
    });
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "HyperTrack");
  return wb;
}

export async function readFirstSheet(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("El archivo no tiene hojas.");
  return XLSX.utils.sheet_to_json(ws);
}

export function saveWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename);
}
