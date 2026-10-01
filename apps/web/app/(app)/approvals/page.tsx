"use client";

import { useCrece } from "../../../lib/crece-ds";

/**
 * D-04 · Bandeja por firmar (fase 7). Dueño: Benjamin (tarea B5).
 * Esqueleto del PR 0: la entrada «Por firmar» del menú ya apunta aquí.
 */
export default function ApprovalsPage() {
  const { PageHeader, EmptyState } = useCrece();
  return (
    <>
      <PageHeader overline="Autorización" title="Por firmar" description="Lo que tus cargos aún deben firmar o votar." />
      <EmptyState title="Tu bandeja llega en el sprint 2" description="Aquí verás las solicitudes en revisión que esperan tu firma o tu voto." />
    </>
  );
}
