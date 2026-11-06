import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Activity, CalendarCheck, CircleCheck, Dumbbell, Flame, Lightbulb, Minus, TrendingUp } from "lucide-react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PageLoader } from "../components/Spinner.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { estimate1RM, MUSCLES } from "../utils/epley.js";
import { daysSince, formatSessionDate } from "../utils/dates.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const CHART_OPTS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#9ca3af" } } },
  scales: {
    x: { ticks: { color: "#9ca3af" }, grid: { color: "#262626" } },
    y: { ticks: { color: "#9ca3af" }, grid: { color: "#262626" } },
  },
};

const RECOVERY = {
  none: { Icon: Minus, color: "bg-gray-700", label: "Sin datos" },
  tired: { Icon: Flame, color: "bg-danger/70", label: "Fatigado" },
  recovering: { Icon: Activity, color: "bg-yellow-600/70", label: "Recuperando" },
  ready: { Icon: CircleCheck, color: "bg-accent/70", label: "Listo" },
};

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch("/workouts", { initialData: [] });
  const sessions = data || [];
  const [picked, setPicked] = useState("");

  const exerciseNames = useMemo(() => {
    const names = new Set();
    sessions.forEach((s) => s.sets.forEach((x) => names.add(x.exerciseName)));
    return Array.from(names);
  }, [sessions]);

  const selectedExercise = exerciseNames.includes(picked) ? picked : exerciseNames[0] || "";

  // Fuerza estimada (1RM) por sesión para el ejercicio elegido
  const rmChartData = useMemo(() => {
    const points = sessions
      .slice()
      .reverse()
      .map((s) => {
        const relevant = s.sets.filter((x) => x.exerciseName === selectedExercise);
        if (relevant.length === 0) return null;
        return {
          date: formatSessionDate(s.date, { day: "2-digit", month: "short" }),
          value: Math.max(...relevant.map((x) => estimate1RM(x.weight, x.reps))),
        };
      })
      .filter(Boolean);

    return {
      labels: points.map((p) => p.date),
      datasets: [
        {
          label: `1RM estimado — ${selectedExercise || "—"}`,
          data: points.map((p) => p.value),
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f633",
          tension: 0.3,
        },
      ],
    };
  }, [sessions, selectedExercise]);

  // Volumen (peso x reps) por músculo en los últimos 7 días
  const volumeChartData = useMemo(() => {
    const byMuscle = {};
    sessions.forEach((s) => {
      if (daysSince(s.date) >= 7) return;
      s.sets.forEach((x) => {
        byMuscle[x.muscle] = (byMuscle[x.muscle] || 0) + x.weight * x.reps;
      });
    });
    const labels = Object.keys(byMuscle);
    return {
      labels,
      datasets: [{ label: "Volumen (kg)", data: labels.map((m) => Math.round(byMuscle[m])), backgroundColor: "#10b981aa" }],
    };
  }, [sessions]);

  // Recuperación: días desde la última vez que se entrenó cada músculo
  const recovery = useMemo(() => {
    const last = {};
    sessions.forEach((s) => {
      const d = daysSince(s.date);
      s.sets.forEach((x) => {
        if (last[x.muscle] === undefined || d < last[x.muscle]) last[x.muscle] = d;
      });
    });
    return MUSCLES.map((muscle) => {
      const days = last[muscle];
      if (days === undefined) return { muscle, ...RECOVERY.none, detail: "Sin datos" };
      const kind = days < 2 ? "tired" : days < 4 ? "recovering" : "ready";
      return { muscle, ...RECOVERY[kind], detail: `${days === 0 ? "Hoy" : `Hace ${days}d`} · ${RECOVERY[kind].label}` };
    });
  }, [sessions]);

  // Sobrecarga progresiva según la última sesión de cada ejercicio
  const suggestions = useMemo(() => {
    const last = {};
    sessions.forEach((s) => {
      const t = new Date(s.date).getTime();
      s.sets.forEach((x) => {
        const cur = last[x.exerciseName];
        if (!cur || t > cur.t) last[x.exerciseName] = { t, sets: [x] };
        else if (t === cur.t) cur.sets.push(x);
      });
    });
    return Object.entries(last).map(([name, info]) => {
      const avgReps = info.sets.reduce((a, b) => a + b.reps, 0) / info.sets.length;
      const maxWeight = Math.max(...info.sets.map((x) => x.weight));
      return {
        name,
        tip:
          avgReps >= 12
            ? `Sube a ${maxWeight + 2.5} kg — ya dominas las repeticiones actuales.`
            : `Intenta una repetición más por serie a ${maxWeight} kg.`,
      };
    });
  }, [sessions]);

  const header = <PageHeader title="Resumen de Progreso" subtitle="Analiza tu fuerza y recibe sugerencias de sobrecarga." />;

  if (loading) return <Layout>{header}<PageLoader /></Layout>;
  if (error) return <Layout>{header}<ErrorState message={error} onRetry={reload} /></Layout>;

  return (
    <Layout>
      {header}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-darker border border-gray-800 p-4 rounded-xl flex items-center gap-4">
          <span className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><CalendarCheck size={20} aria-hidden="true" /></span>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Sesiones totales</p>
            <p className="text-xl font-bold">{sessions.length}</p>
          </div>
        </div>
        <div className="bg-darker border border-gray-800 p-4 rounded-xl flex items-center gap-4">
          <span className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center"><Dumbbell size={20} aria-hidden="true" /></span>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Ejercicios distintos</p>
            <p className="text-xl font-bold">{exerciseNames.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3">Estado de recuperación</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {recovery.map(({ muscle, Icon, color, detail }) => (
            <div key={muscle} className={`${color} rounded-xl p-3 text-center`}>
              <Icon size={18} className="mx-auto mb-1" aria-hidden="true" />
              <p className="font-bold text-sm">{muscle}</p>
              <p className="text-xs text-gray-100/80 mt-1">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-4 md:p-6 shadow-xl">
          <div className="flex justify-between items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">Fuerza estimada (1RM)</h3>
            {exerciseNames.length > 0 && (
              <select
                aria-label="Ejercicio"
                value={selectedExercise}
                onChange={(e) => setPicked(e.target.value)}
                className="bg-darker border border-gray-700 text-white rounded-lg p-2 text-sm outline-none max-w-[50%]"
              >
                {exerciseNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">Basado en la fórmula Epley (peso × reps).</p>
          {exerciseNames.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Aún no hay datos de fuerza">Registra un entrenamiento para ver tu progreso.</EmptyState>
          ) : (
            <div className="h-64"><Line data={rmChartData} options={CHART_OPTS_BASE} /></div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-4 md:p-6 shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Volumen (últimos 7 días)</h3>
          <p className="text-xs text-gray-400 mb-4">Total de kg movidos por grupo muscular.</p>
          {volumeChartData.labels.length === 0 ? (
            <EmptyState icon={Dumbbell} title="Sin entrenamientos esta semana">Lo que registres en los últimos 7 días aparecerá aquí.</EmptyState>
          ) : (
            <div className="h-64"><Bar data={volumeChartData} options={CHART_OPTS_BASE} /></div>
          )}
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4 mt-10">Sugerencias inteligentes</h3>
      {suggestions.length === 0 ? (
        <EmptyState icon={Lightbulb} title="Todavía no hay sugerencias">Registra tu primer entrenamiento para recibirlas.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((s) => (
            <div key={s.name} className="bg-darker border border-gray-800 rounded-xl p-4 flex gap-3">
              <Lightbulb size={20} className="text-yellow-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold mb-1">{s.name}</p>
                <p className="text-sm text-gray-400">{s.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
