import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, Package, Plus, Trash2 } from "lucide-react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ErrorState, { FormError } from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PageLoader, Spinner } from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import { useFetch } from "../hooks/useFetch.js";
import api from "../api/axios.js";
import { getErrorMessage } from "../utils/errors.js";
import { DAYS, MUSCLES } from "../utils/epley.js";

export default function Routine() {
  const [view, setView] = useState("active");

  return (
    <Layout>
      <PageHeader title="Mi rutina" subtitle="Diseña tu plan de entrenamiento por día y grupo muscular.">
        <div className="flex gap-2 bg-darker p-1 rounded-lg border border-gray-800" role="tablist">
          {[["active", "Activa"], ["archived", "Archivo"]].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                view === key ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </PageHeader>

      {view === "active" ? <ActivePlan /> : <ArchivedList />}
    </Layout>
  );
}

function ActivePlan() {
  const { data, setData, loading, error, reload } = useFetch("/routine", { initialData: [] });
  const entries = data || [];
  const toast = useToast();
  const [form, setForm] = useState({ day: DAYS[0], muscle: MUSCLES[0], name: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionSource, setSuggestionSource] = useState("");

  // Sugerencias de la API externa (wger.de) según el músculo elegido. Si fallan, la pantalla sigue funcionando.
  useEffect(() => {
    let cancelled = false;
    api
      .get("/exercises/suggestions", { params: { muscle: form.muscle } })
      .then((res) => {
        if (cancelled) return;
        setSuggestions(res.data.suggestions || []);
        setSuggestionSource(res.data.source);
      })
      .catch(() => {
        if (cancelled) return;
        setSuggestions([]);
        setSuggestionSource("");
      });
    return () => {
      cancelled = true;
    };
  }, [form.muscle]);

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");
    const name = form.name.trim();
    if (!name) return setFormError("Escribe el nombre del ejercicio.");

    setSaving(true);
    try {
      const res = await api.post("/routine", { ...form, name });
      setData((prev) => [...prev, res.data]);
      setForm({ ...form, name: "" });
      toast.success("Ejercicio agregado al plan.");
    } catch (err) {
      setFormError(getErrorMessage(err, "No se pudo guardar el ejercicio."));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id) {
    setBusyId(id);
    try {
      await api.patch(`/routine/${id}/archive`);
      setData((prev) => prev.filter((x) => x.id !== id));
      toast.success("Ejercicio archivado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo archivar el ejercicio."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const byDay = DAYS.map((day) => ({ day, items: entries.filter((e) => e.day === day) }));

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 border border-gray-800 shadow-xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-primary" aria-hidden="true" /> Añadir ejercicio al plan
        </h3>
        <FormError message={formError} />
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="r-day" className="block text-xs text-gray-400 mb-1">Día</label>
            <select id="r-day" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="input">
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="r-muscle" className="block text-xs text-gray-400 mb-1">Músculo</label>
            <select id="r-muscle" value={form.muscle} onChange={(e) => setForm({ ...form, muscle: e.target.value })} className="input">
              {MUSCLES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="r-name" className="block text-xs text-gray-400 mb-1">Ejercicio</label>
            <input
              id="r-name"
              list="suggestion-list"
              type="text"
              maxLength={100}
              placeholder="Ej. Press plano"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
            <datalist id="suggestion-list">
              {suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving && <Spinner />} Guardar
          </button>
        </form>
        {suggestions.length > 0 && (
          <p className="text-[11px] text-gray-500 mt-3">
            Sugerencias para «{form.muscle}» vía {suggestionSource === "wger.de" ? "API externa (wger.de)" : "catálogo local"}:{" "}
            {suggestions.slice(0, 4).join(" · ")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {byDay.map(({ day, items }) => (
          <div key={day} className="bg-darker border border-gray-800 rounded-xl p-4">
            <h4 className="font-bold mb-3">{day}</h4>
            {items.length === 0 && <p className="text-xs text-gray-600">Sin ejercicios</p>}
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between items-center gap-2 bg-card rounded-lg px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{it.name}</p>
                    <p className="text-[11px] text-gray-500">{it.muscle}</p>
                  </div>
                  <button onClick={() => handleArchive(it.id)} disabled={busyId === it.id} aria-label={`Archivar ${it.name}`} className="icon-btn hover:text-yellow-500">
                    {busyId === it.id ? <Spinner size={16} /> : <Archive size={16} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchivedList() {
  const { data, setData, loading, error, reload } = useFetch("/routine/archived", { initialData: [] });
  const archived = data || [];
  const toast = useToast();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState(null);

  async function handleRestore(id) {
    setBusyId(id);
    try {
      await api.patch(`/routine/${id}/restore`);
      setData((prev) => prev.filter((x) => x.id !== id));
      toast.success("Ejercicio restaurado a tu plan.");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo restaurar el ejercicio."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item) {
    const ok = await confirm({
      title: "Eliminar ejercicio",
      message: `«${item.name}» se eliminará definitivamente del archivo.`,
      confirmText: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await api.delete(`/routine/${item.id}`);
      setData((prev) => prev.filter((x) => x.id !== item.id));
      toast.success("Ejercicio eliminado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el ejercicio."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="glass-card rounded-2xl p-5 border border-gray-800 shadow-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Package size={20} className="text-primary" aria-hidden="true" /> Ejercicios archivados
      </h3>
      {archived.length === 0 && <EmptyState icon={Package} title="No hay ejercicios archivados">Los que archives desde tu plan aparecerán aquí.</EmptyState>}
      <div className="space-y-3">
        {archived.map((a) => (
          <div key={a.id} className="flex justify-between items-center gap-3 bg-darker rounded-lg px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{a.name}</p>
              <p className="text-xs text-gray-500">{a.day} · {a.muscle}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleRestore(a.id)} disabled={busyId === a.id} aria-label={`Restaurar ${a.name}`} className="icon-btn hover:text-primary">
                <ArchiveRestore size={18} />
              </button>
              <button onClick={() => handleDelete(a)} disabled={busyId === a.id} aria-label={`Eliminar ${a.name}`} className="icon-btn hover:text-danger">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
