"use client";

import { useCrece } from "../../lib/crece-ds";
import { useApiData } from "../../lib/use-api";
import type { History } from "../../lib/types";
import { auditActionLabel, auditDescription, dateTime } from "../../lib/view";

/** Bitácora append-only del expediente: quién hizo qué y qué cambió. */
export function HistoryPanel({
  operationId,
  version,
  checklistLabels,
}: {
  operationId: string;
  version: string;
  checklistLabels: Record<string, string>;
}) {
  const { Card, Timeline, Skeleton, Alert } = useCrece();
  // `version` (updatedAt) vuelve a pedir la bitácora después de cada cambio.
  const { data, error, loading } = useApiData<History>(`/operations/${operationId}/history?v=${encodeURIComponent(version)}`);

  return (
    <Card title="Bitácora">
      {error && <Alert tone="danger">{error}</Alert>}
      {loading ? (
        <Skeleton lines={4} />
      ) : (
        <Timeline
          items={[...(data?.items ?? [])].reverse().map((entry) => ({
            id: entry.id,
            title: auditActionLabel(entry.action),
            description: auditDescription(entry, checklistLabels),
            meta: `${dateTime(entry.at)} · ${entry.byUserId}`,
            state: "done",
          }))}
        />
      )}
    </Card>
  );
}
