import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, Trash2 } from "lucide-react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { FormError } from "../components/ErrorState.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";
import { useFetch } from "../hooks/useFetch.js";
import api from "../api/axios.js";
import { getErrorMessage } from "../utils/errors.js";
import { todayLocalISO } from "../utils/dates.js";
import { MUSCLES } from "../utils/epley.js";

export default function AddWorkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const nextKey = useRef(1);
  const newRow = () => ({ key: nextKey.current++, exerciseName: "", muscle: MUSCLES[0], weight: "", reps: "" });

  const [date, setDate] = useState(todayLocalISO());
  const [rows, setRows] = useState(() => [newRow()]);
  const [rowErrors, setRowErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Nombres de la rutina para autocompletar. Si falla, el formulario sigue funcionando sin sugerencias.
  const { data: routine } = useFetch("/routine", { initialData: [] });
  const routineNames = [...new Set((routine || []).map((r) => r.name))];

  const updateRow = (key, field, value) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  function validate() {
    const errs = {};
    const used = rows.filter((r) => r.exerciseName.trim() || r.weight !== "" || r.reps !== "");
    if (used.length === 0) {
      setError("Agrega al menos un ejercicio con peso y repeticiones.");
      return null;
    }
    for (const r of used) {
      const w = Number(r.weight);
      const reps = Number(r.reps);
      const e = {};
      if (!r.exerciseName.trim()) e.exerciseName = "Falta el ejercicio";
      if (r.weight === "" || !Number.isFinite(w) || w < 0 || w > 2000) e.weight = "Peso entre 0 y 2000";
      if (r.reps === "" || !Number.isInteger(reps) || reps < 1 || reps > 1000) e.reps = "Reps: entero ≥ 1";
      if (Object.keys(e).length) errs[r.key] = e;
    }
    setRowErrors(errs);
    if (Object.keys(errs).length) {
      setError("Revisa los campos marcados en rojo.");
      return null;
    }
    return used;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setRowErrors({});
    if (!date) return setError("Elige la fecha del entrenamiento.");
    const valid = validate();
    if (!valid) return;

    setSaving(true);
    try {
      await api.post("/workouts", {
        date,
        sets: valid.map((r, i) => ({
          exerciseName: r.exerciseName.trim(),
          muscle: r.muscle,
          weight: Number(r.weight),
          reps: Number(r.reps),
          setNumber: i + 1,
        })),
      });
      toast.success("Entrenamiento guardado.");
      navigate("/historial");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar el entrenamiento."));
    } finally {
      setSaving(false);
    }
  }

  const cell = (r, field) => `input ${rowErrors[r.key]?.[field] ? "input-error" : ""}`;
  const msg = (r, field) => rowErrors[r.key]?.[field] && <p className="text-xs text-red-400 mt-1">{rowErrors[r.key][field]}</p>;

  return (
    <Layout>
      <PageHeader title="Nuevo registro" subtitle="Añade los ejercicios de tu sesión." />

      <form onSubmit={handleSubmit} noValidate className="max-w-3xl space-y-6">
        <FormError message={error} />

        <div className="glass-card rounded-2xl p-5 border border-gray-800">
          <label htmlFor="w-date" className="block text-xs text-gray-400 mb-1">Fecha</label>
          <input id="w-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto" />
        </div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="glass-card rounded-2xl p-4 border border-gray-800 grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Ejercicio</label>
                <input
                  list="routine-names"
                  type="text"
                  maxLength={100}
                  placeholder="Ej. Press de banca"
                  value={r.exerciseName}
                  onChange={(e) => updateRow(r.key, "exerciseName", e.target.value)}
                  className={cell(r, "exerciseName")}
                />
                {msg(r, "exerciseName")}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Músculo</label>
                <select value={r.muscle} onChange={(e) => updateRow(r.key, "muscle", e.target.value)} className="input">
                  {MUSCLES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Peso (kg)</label>
                <input type="number" inputMode="decimal" min="0" step="0.5" value={r.weight} onChange={(e) => updateRow(r.key, "weight", e.target.value)} className={cell(r, "weight")} />
                {msg(r, "weight")}
              </div>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Reps</label>
                  <input type="number" inputMode="numeric" min="1" step="1" value={r.reps} onChange={(e) => updateRow(r.key, "reps", e.target.value)} className={cell(r, "reps")} />
                  {msg(r, "reps")}
                </div>
                {rows.length > 1 && (
                  <button type="button" onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))} aria-label="Quitar ejercicio" className="icon-btn hover:text-danger mt-5">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <datalist id="routine-names">
            {routineNames.map((n) => <option key={n} value={n} />)}
          </datalist>
        </div>

        <button type="button" onClick={() => setRows((prev) => [...prev, newRow()])} className="text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1.5">
          <Plus size={16} aria-hidden="true" /> Añadir otro ejercicio
        </button>

        <div>
          <button type="submit" disabled={saving} className="btn-primary py-3 px-8">
            {saving ? <Spinner /> : <Save size={18} aria-hidden="true" />}
            {saving ? "Guardando…" : "Guardar entrenamiento"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
