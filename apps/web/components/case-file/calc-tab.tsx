"use client";

import { useCrece } from "../../lib/crece-ds";
import type { CasePanelProps } from "./use-case-action";

/**
 * Fase 4 · Cálculo y reglas (C-03, C-09).
 * Dueño: Josué (tareas R6). Esqueleto del PR 0: reemplaza este contenido, no cambies la firma.
 */
export function CalcTab(_props: CasePanelProps) {
  const { EmptyState } = useCrece();
  return (
    <EmptyState
      title="Cálculo y reglas"
      description="Aquí verás el resultado del motor, las reglas que avisan o bloquean y sus excepciones justificadas."
    />
  );
}
