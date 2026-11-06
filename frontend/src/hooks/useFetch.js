import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { getErrorMessage } from "../utils/errors.js";

// Carga un GET con estados de loading / error y una función reload() para reintentar.
export function useFetch(url, { initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const alive = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(url);
      if (alive.current) setData(res.data);
    } catch (err) {
      if (alive.current) setError(getErrorMessage(err, "No se pudieron cargar los datos."));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { data, setData, loading, error, reload: load };
}
