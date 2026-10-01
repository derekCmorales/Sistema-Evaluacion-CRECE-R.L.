"use client";

import * as React from "react";
import { errorMessage } from "./api";
import { useSession } from "./session";

/** Lectura de la API con la sesión actual; se vuelve a pedir al cambiar de usuario o con `reload`. */
export function useApiData<T>(path: string | null) {
  const { request, user } = useSession();
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    if (!path) return;
    let active = true;
    setError(null);
    request<T>(path).then(
      (result) => active && setData(result),
      (e) => {
        if (!active) return;
        setData(null);
        setError(errorMessage(e));
      },
    );
    return () => {
      active = false;
    };
    // `request` cambia con el usuario; `version` fuerza recarga.
  }, [path, request, user.id, version]);

  return { data, error, loading: path !== null && data === null && error === null, reload: () => setVersion((v) => v + 1), setData };
}
