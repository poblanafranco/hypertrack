import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Lock, LogIn, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthCard from "../components/AuthCard.jsx";
import Field from "../components/Field.jsx";
import { FormError } from "../components/ErrorState.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { getErrorMessage, getFieldErrors } from "../utils/errors.js";

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "Escribe un correo válido.";
    if (!form.password) errs.password = "Escribe tu contraseña.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "No se pudo iniciar sesión."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      subtitle="Inicia sesión para continuar"
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-primary font-semibold">
            Regístrate
          </Link>
        </>
      }
    >
      <FormError message={error} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Correo" icon={Mail} type="email" autoComplete="email" value={form.email} onChange={set("email")} error={fieldErrors.email} />
        <Field label="Contraseña" icon={Lock} type="password" autoComplete="current-password" value={form.password} onChange={set("password")} error={fieldErrors.password} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner /> : <LogIn size={18} aria-hidden="true" />}
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </AuthCard>
  );
}
