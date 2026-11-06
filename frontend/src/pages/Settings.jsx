import { useRef, useState } from "react";
import { Download, LogOut, ShieldAlert, Trash2, Upload } from "lucide-react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { getErrorMessage } from "../utils/errors.js";
import { buildExportWorkbook, parseWorkoutRows, readFirstSheet, saveWorkbook } from "../utils/excel.js";
import { todayLocalISO } from "../utils/dates.js";

const MAX_FILE_MB = 5;

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const fileInput = useRef(null);
  const [busy, setBusy] = useState(""); // "export" | "import" | "delete" | ""
  const [importErrors, setImportErrors] = useState([]);

  async function handleExport() {
    setBusy("export");
    try {
      const res = await api.get("/workouts");
      if (res.data.length === 0) return toast.info("Todavía no tienes entrenamientos para exportar.");
      saveWorkbook(buildExportWorkbook(res.data), `hypertrack_${todayLocalISO()}.xlsx`);
      toast.success("Exportación lista.");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo exportar tus entrenamientos."));
    } finally {
      setBusy("");
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setImportErrors([]);

    if (!/\.xlsx?$/i.test(file.name)) return toast.error("El archivo debe ser de Excel (.xlsx o .xls).");
    if (file.size > MAX_FILE_MB * 1024 * 1024) return toast.error(`El archivo pesa más de ${MAX_FILE_MB} MB.`);

    setBusy("import");
    try {
      let rows;
      try {
        rows = await readFirstSheet(file);
      } catch {
        return toast.error("No se pudo leer el archivo. Verifica que sea un Excel válido.");
      }

      const { sessions, errors } = parseWorkoutRows(rows);
      if (errors.length) {
        setImportErrors(errors);
        return toast.error("El archivo tiene errores. No se importó nada.");
      }

      const res = await api.post("/workouts/bulk", { sessions });
      toast.success(`Se importaron ${res.data.imported} ${res.data.imported === 1 ? "sesión" : "sesiones"} correctamente.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Ocurrió un error al importar el archivo."));
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteAll() {
    const ok = await confirm({
      title: "Eliminar todos tus registros",
      message: "Se borrarán TODAS tus sesiones de entrenamiento. Esta acción no se puede deshacer.",
      confirmText: "Eliminar todo",
      danger: true,
    });
    if (!ok) return;

    setBusy("delete");
    try {
      await api.delete("/workouts/all/clear");
      toast.success("Se eliminaron todos tus registros.");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudieron eliminar los registros."));
    } finally {
      setBusy("");
    }
  }

  return (
    <Layout>
      <PageHeader title="Ajustes" subtitle="Administra tu cuenta y tus datos." />

      <div className="max-w-2xl space-y-6">
        <div className="glass-card rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-lg">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{user?.name}</p>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-gray-800 space-y-4">
          <h3 className="font-bold">Datos</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleExport} disabled={!!busy} className="btn-ghost">
              {busy === "export" ? <Spinner size={16} /> : <Download size={16} aria-hidden="true" />} Exportar a Excel
            </button>
            <button onClick={() => fileInput.current?.click()} disabled={!!busy} className="btn-ghost">
              {busy === "import" ? <Spinner size={16} /> : <Upload size={16} aria-hidden="true" />} Importar Excel
            </button>
            <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </div>
          <p className="text-xs text-gray-500">Columnas esperadas: fecha, ejercicio, musculo, peso_kg, reps, set.</p>

          {importErrors.length > 0 && (
            <div role="alert" className="bg-danger/15 text-red-300 text-sm rounded-lg p-3">
              <p className="font-semibold mb-1">No se importó nada. Corrige esto en el archivo:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {importErrors.slice(0, 8).map((m) => <li key={m}>{m}</li>)}
              </ul>
              {importErrors.length > 8 && <p className="mt-1 text-xs">…y {importErrors.length - 8} más.</p>}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 border border-danger/40 space-y-3">
          <h3 className="font-bold text-danger flex items-center gap-2">
            <ShieldAlert size={18} aria-hidden="true" /> Zona de riesgo
          </h3>
          <button onClick={handleDeleteAll} disabled={!!busy} className="btn bg-danger/20 hover:bg-danger/30 text-danger text-sm py-2 px-4">
            {busy === "delete" ? <Spinner size={16} /> : <Trash2 size={16} aria-hidden="true" />} Eliminar todos mis registros
          </button>
        </div>

        <button onClick={logout} className="md:hidden flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold">
          <LogOut size={16} aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </Layout>
  );
}
