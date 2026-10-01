"use client";

import { useCrece } from "../../lib/crece-ds";
import type { CasePanelProps } from "./use-case-action";

/**
 * Fase 5 · Dictamen 5C y envío a revisión (C-08).
 * Dueño: Josué (tareas R7). Esqueleto del PR 0: reemplaza este contenido, no cambies la firma.
 */
export function OpinionTab(_props: CasePanelProps) {
  const { EmptyState } = useCrece();
  return (
    <EmptyState
      title="Dictamen"
      description="Aquí escribirás el dictamen 5C, marcarás la solicitud lista y la enviarás a revisión."
    />
  );
}
