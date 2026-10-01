"use client";

import { useCrece } from "../../lib/crece-ds";
import type { CasePanelProps } from "./use-case-action";

/**
 * Fase 7 · Decisión: firma dual o voto del Consejo y acta (D-06, D-07).
 * Dueño: Benjamin (tareas B6). Esqueleto del PR 0: reemplaza este contenido, no cambies la firma.
 */
export function DecisionTab(_props: CasePanelProps) {
  const { EmptyState } = useCrece();
  return (
    <EmptyState
      title="Decisión"
      description="Aquí se registran las firmas o los votos y se consulta el acta."
    />
  );
}
