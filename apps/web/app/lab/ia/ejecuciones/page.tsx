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
} from "../../../../lib/lab-api";

export default function RunsPage() {
  const { Card, DataTable, Badge, Alert, EmptyState, Button } = useCrece();
  const router = useRouter();
  const [runs, setRuns] = useState<LabRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => labApi.runs().then(setRuns, (e: Error) => setError(e.message));
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
      </p>
      <DataTable
        columns={[
          { key: "createdAt", label: "Fecha", render: (r: LabRun) => new Date(r.createdAt).toLocaleString("es-GT") },
          { key: "task", label: "Tarea", render: (r: LabRun) => TASK_LABELS[r.task] ?? r.task },
          { key: "status", label: "Estado", render: (r: LabRun) => <Badge tone={RUN_STATUS_TONE[r.status]}>{RUN_STATUS_LABELS[r.status]}</Badge> },
          { key: "modelId", label: "Modelo" },
          { key: "latencyMs", label: "Tiempo", numeric: true, render: (r: LabRun) => formatSeconds(r.latencyMs) },
          { key: "costEstimateUsd", label: "Costo", numeric: true, render: (r: LabRun) => formatUsd(r.costEstimateUsd) },
          { key: "errorCode", label: "Error", render: (r: LabRun) => r.errorCode ?? "" },
        ]}
        rows={runs ?? []}
        onRowClick={(r: LabRun) => r.task === "EXTRACT" && router.push(`/lab/ia/extraccion?run=${r.id}`)}
        empty={<EmptyState title="Todavía no hay ejecuciones" description="Sube un documento en la pestaña Extracción." />}
      />
    </Card>
  );
}
