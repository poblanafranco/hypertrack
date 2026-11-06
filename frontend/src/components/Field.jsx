import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Campo de formulario con icono, etiqueta, error por campo y (si es contraseña) botón para mostrarla
export default function Field({ label, icon: Icon, error, type = "text", id, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputId = id || `f-${label.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs text-gray-400 mb-1">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />}
        <input
          id={inputId}
          type={isPassword && show ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`input ${Icon ? "pl-9" : ""} ${isPassword ? "pr-10" : ""} ${error ? "input-error" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
