import { useState } from "react";
import { CalendarX, ChevronDown, Trash2 } from "lucide-react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PageLoader, Spinner } from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import { useFetch } from "../hooks/useFetch.js";
import api from "../api/axios.js";
import { getErrorMessage } from "../utils/errors.js";
import { formatSessionDate } from "../utils/dates.js";

export default function History() {
  const { data, setData, loading, error, reload } = useFetch("/workouts", { initialData: [] });
  const sessions = data || [];
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  async function handleDelete(id) {
    const ok = await confirm({
      title: "Eliminar sesión",
      message: "Se borrará esta sesión de entrenamiento con todos sus sets. No se puede deshacer.",
      confirmText: "Eliminar",
      danger: true,
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await api.delete(`/workouts/${id}`);
      setData((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sesión eliminada.");
    } catch (err) {
      // Si ya no existía (404), se quita de la lista de todos modos
      if (err.response?.status === 404) setData((prev) => prev.filter((s) => s.id !== id));
      else toast.error(getErrorMessage(err, "No se pudo eliminar la sesión."));
    } finally {
      setDeletingId(null);
    }
  }

  const header = (
    <PageHeader title="Tu historial" subtitle="Revisa todos tus entrenamientos pasados.">
      {!loading && !error && (
        <div className="text-sm text-gray-400 font-semibold bg-gray-800 px-3 py-1 rounded-full">
          {sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"}
        </div>
      )}
    </PageHeader>
  );

  if (loading) return <Layout>{header}<PageLoader /></Layout>;
  if (error) return <Layout>{header}<ErrorState message={error} onRetry={reload} /></Layout>;

  return (
    <Layout>
      {header}
      <div className="space-y-4">
        {sessions.length === 0 && (
          <EmptyState icon={CalendarX} title="Aún no tienes entrenamientos registrados">
            Usa «Registrar» para guardar tu primera sesión.
          </EmptyState>
        )}

        {sessions.map((s) => {
          const totalVolume = s.sets.reduce((acc, x) => acc + x.weight * x.reps, 0);
          const isOpen = expanded === s.id;
          return (
            <div key={s.id} className="bg-darker border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center gap-3">
                <button
                  className="text-left flex-1 flex items-center gap-3"
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  aria-expanded={isOpen}
                >
                  <ChevronDown size={18} className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  <span>
                    <span className="block font-bold first-letter:uppercase">
                      {formatSessionDate(s.date, { weekday: "long", day: "2-digit", month: "long" })}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {s.sets.length} sets · {Math.round(totalVolume)} kg de volumen
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  aria-label="Eliminar sesión"
                  className="icon-btn hover:text-danger"
                >
                  {deletingId === s.id ? <Spinner size={18} /> : <Trash2 size={18} />}
                </button>
              </div>

              {isOpen && (
                <ul className="mt-4 space-y-1 border-t border-gray-800 pt-3">
                  {s.sets.map((x) => (
                    <li key={x.id} className="flex justify-between text-sm text-gray-300">
                      <span>
                        {x.exerciseName} <span className="text-gray-600">({x.muscle})</span>
                      </span>
                      <span>
                        {x.weight} kg × {x.reps} reps
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
