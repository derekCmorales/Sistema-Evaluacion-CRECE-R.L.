"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCrece } from "../../../../lib/crece-ds";
import {
  RUN_STATUS_LABELS,
  RUN_STATUS_TONE,
  TASK_LABELS,
  formatSeconds,
  formatUsd,
  labApi,
  type LabRun,
  type LabStatus,
} from "../../../../lib/lab-api";

export default function RunsPage() {
  const { Card, DataTable, Badge, Alert, EmptyState, Button } = useCrece();
  const router = useRouter();
  const [runs, setRuns] = useState<LabRun[] | null>(null);
  const [status, setStatus] = useState<LabStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    Promise.all([labApi.runs(), labApi.status()]).then(
      ([loadedRuns, loadedStatus]) => {
        setRuns(loadedRuns);
        setStatus(loadedStatus);
      },
      (e: Error) => setError(e.message),
    );
  useEffect(() => {
    void load();
  }, []);

  if (error) {
    return (
      <Alert tone="danger" title="No se pudieron cargar las ejecuciones">
        {error}
      </Alert>
    );
  }

  const total = (runs ?? []).reduce((sum, r) => sum + (r.costEstimateUsd ?? 0), 0);

  return (
    <Card
      title="Ejecuciones del laboratorio"
      action={
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Actualizar
        </Button>
      }
    >
      <p className="body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
        Costo estimado de estas ejecuciones: {formatUsd(total)}. No cuenta en los reportes de producción.
        {status ? ` · Workers activos: ${status.workersOnline} · En cola: ${status.queued} · Procesando: ${status.running}` : ""}
      </p>
      {status && status.workersOnline === 0 && status.queued > 0 && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Alert tone="warning" title="Hay ejecuciones en cola y ningún worker corriendo">
            Arranca el worker con «pnpm --filter @crece/api start:worker».
          </Alert>
        </div>
      )}
      <DataTable
        columns={[
          { key: "createdAt", label: "Fecha", render: (r: LabRun) => new Date(r.createdAt).toLocaleString("es-GT") },
          { key: "task", label: "Tarea", render: (r: LabRun) => TASK_LABELS[r.task] ?? r.task },
          { key: "status", label: "Estado", render: (r: LabRun) => <Badge tone={RUN_STATUS_TONE[r.status]}>{RUN_STATUS_LABELS[r.status]}</Badge> },
          { key: "modelId", label: "Modelo" },
          { key: "latencyMs", label: "Tiempo", numeric: true, render: (r: LabRun) => formatSeconds(r.latencyMs) },
          { key: "costEstimateUsd", label: "Costo", numeric: true, render: (r: LabRun) => formatUsd(r.costEstimateUsd) },
          { key: "errorCode", label: "Error", render: (r: LabRun) => r.errorCode ?? "" },
          {
            key: "output",
            label: "Señales",
            render: (r: LabRun) => (r.output?.injectionSuspected ? <Badge tone="warning">Inyección</Badge> : r.retryOf ? "Reintento" : ""),
          },
        ]}
        rows={runs ?? []}
        onRowClick={(r: LabRun) => r.task === "EXTRACT" && router.push(`/lab/ia/extraccion?run=${r.id}`)}
        empty={<EmptyState title="Todavía no hay ejecuciones" description="Sube un documento en la pestaña Extracción." />}
      />
    </Card>
  );
}
