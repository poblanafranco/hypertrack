import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";

const ConfirmContext = createContext(null);

// const confirm = useConfirm();  if (await confirm({ title, message, confirmText, danger })) { ... }
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const cancelRef = useRef(null);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...opts, resolve })),
    []
  );

  function close(result) {
    dialog?.resolve(result);
    setDialog(null);
  }

  useEffect(() => {
    if (!dialog) return;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onMouseDown={() => close(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card border border-gray-800 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`flex w-10 h-10 items-center justify-center rounded-full ${dialog.danger ? "bg-danger/15 text-danger" : "bg-primary/15 text-primary"}`}>
                <TriangleAlert size={20} aria-hidden="true" />
              </span>
              <h3 id="confirm-title" className="text-lg font-bold">
                {dialog.title}
              </h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              <button ref={cancelRef} onClick={() => close(false)} className="btn-ghost">
                Cancelar
              </button>
              <button onClick={() => close(true)} className={`${dialog.danger ? "btn-danger" : "btn-primary"} text-sm`}>
                {dialog.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
