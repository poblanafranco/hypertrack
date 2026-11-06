import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Lock, Mail, User, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthCard from "../components/AuthCard.jsx";
import Field from "../components/Field.jsx";
import { FormError } from "../components/ErrorState.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { getErrorMessage, getFieldErrors } from "../utils/errors.js";

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errs = {};
    if (!form.name.trim()) errs.name = "El nombre es obligatorio.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "Escribe un correo válido.";
    if (form.password.length < 6) errs.password = "La contraseña debe tener al menos 6 caracteres.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err, "No se pudo crear la cuenta."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      subtitle="Crea tu cuenta"
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary font-semibold">
            Inicia sesión
          </Link>
        </>
      }
    >
      <FormError message={error} />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Nombre" icon={User} autoComplete="name" value={form.name} onChange={set("name")} error={fieldErrors.name} />
        <Field label="Correo" icon={Mail} type="email" autoComplete="email" value={form.email} onChange={set("email")} error={fieldErrors.email} />
        <Field label="Contraseña (mín. 6 caracteres)" icon={Lock} type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={fieldErrors.password} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner /> : <UserPlus size={18} aria-hidden="true" />}
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
    </AuthCard>
  );
}
