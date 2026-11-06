import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CircleCheck, CircleX, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { Icon: CircleCheck, cls: "border-accent/40 text-accent" },
  error: { Icon: CircleX, cls: "border-danger/40 text-danger" },
  info: { Icon: Info, cls: "border-primary/40 text-primary" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      if (!message) return;
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === "error" ? 6500 : 4000);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 sm:w-96">
        {toasts.map(({ id, type, message }) => {
          const { Icon, cls } = STYLES[type];
          return (
            <div key={id} role={type === "error" ? "alert" : "status"} className={`flex items-start gap-3 bg-card border rounded-xl p-3 shadow-2xl ${cls}`}>
              <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm text-gray-100">{message}</p>
              <button onClick={() => dismiss(id)} aria-label="Cerrar aviso" className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
