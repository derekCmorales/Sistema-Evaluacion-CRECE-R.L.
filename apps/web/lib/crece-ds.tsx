"use client";

import * as React from "react";
import type * as CreceComponents from "../../../design-system/components/index";

/**
 * Único puente al bundle del design system. El bundle es un IIFE que lee `window.React`
 * y publica sus componentes en `window.Crece` (design-system/docs/80-plataformas.md).
 * `scripts/sync-design-system.mjs` lo publica en /ds sin modificarlo.
 */
export type Crece = typeof CreceComponents;

declare global {
  interface Window {
    React?: typeof React;
    Crece?: Crece;
  }
}

const BUNDLE_SRC = "/ds/bundle.js";
let loading: Promise<Crece> | null = null;

function loadBundle(): Promise<Crece> {
  if (window.Crece) return Promise.resolve(window.Crece);
  if (loading) return loading;
  window.React = React;
  loading = new Promise<Crece>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = BUNDLE_SRC;
    script.async = true;
    script.onload = () => (window.Crece ? resolve(window.Crece) : reject(new Error("El design system no se registró")));
    script.onerror = () => {
      loading = null;
      reject(new Error("No se pudo cargar el design system"));
    };
    document.body.appendChild(script);
  });
  return loading;
}

const CreceContext = React.createContext<Crece | null>(null);

export function CreceProvider({ children }: { children: React.ReactNode }) {
  const [ds, setDs] = React.useState<Crece | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    loadBundle().then(
      (loaded) => active && setDs(loaded),
      (e: Error) => active && setError(e.message),
    );
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="body-md" style={{ color: "var(--danger)", padding: "var(--space-6)" }}>
        {error}. Ejecuta `pnpm --filter @crece/web dev` (publica /ds) y recarga la página.
      </p>
    );
  }
  if (!ds) {
    return (
      <p aria-busy="true" className="body-md" style={{ color: "var(--text-secondary)", padding: "var(--space-6)" }}>
        Cargando…
      </p>
    );
  }
  return <CreceContext.Provider value={ds}>{children}</CreceContext.Provider>;
}

/** Componentes del design system. Solo dentro de `CreceProvider`. */
export function useCrece(): Crece {
  const ds = React.useContext(CreceContext);
  if (!ds) throw new Error("useCrece fuera de CreceProvider");
  return ds;
}
