"use client";

import { useCrece } from "../../lib/crece-ds";
import type { CasePanelProps } from "./use-case-action";

/**
 * Fase 6 · Revisión con IA: resumen con evidencia y alertas por resolver.
 * Dueño: Derek (tareas D5). Esqueleto del PR 0: reemplaza este contenido, no cambies la firma.
 */
export function AiReviewTab(_props: CasePanelProps) {
  const { EmptyState } = useCrece();
  return (
    <EmptyState
      title="Revisión con IA"
      description="Cuando la solicitud esté en revisión, aquí verás el resumen con evidencia y las alertas por resolver."
    />
  );
}
