"use client";

import { useRouter } from "next/navigation";
import {
  OPERATION_STATE_LABELS,
  PRODUCT_TYPE_LABELS,
  type CaseFileListItem,
  type PersonListItem,
} from "@crece/shared";
import { useCrece } from "../../../lib/crece-ds";
import { useSession } from "../../../lib/session";
import { useApiData } from "../../../lib/use-api";
import { money, operationStateTone } from "../../../lib/view";

export default function DashboardPage() {
  const { PageHeader, Stat, Card, DataTable, Badge, Button, Alert, Skeleton, EmptyState, Icons } = useCrece();
  const router = useRouter();
  const { can, user } = useSession();
  const persons = useApiData<{ items: PersonListItem[] }>("/persons");
  const cases = useApiData<{ items: CaseFileListItem[] }>("/operations");

  const people = persons.data?.items ?? [];
  const files = cases.data?.items ?? [];
  const inAssembly = files.filter((f) => f.state === "DRAFT" || f.state === "RETURNED_TO_ADVISOR");
  const landingWithoutDpi = people.filter((p) => p.source === "LANDING" && !p.dpiMasked);

  return (
    <>
      <PageHeader
        overline="Captación"
        title="Vista general"
        description={`Sesión: ${user.name}. Expedientes en armado y prospectos por atender.`}
        actions={
          can("person:create") ? (
            <Button variant="primary" icon={Icons.Plus} onClick={() => router.push("/persons/new")}>
              Registrar solicitante
            </Button>
          ) : null
        }
      />

      {(persons.error || cases.error) && (
        <Alert tone="danger" title="No pudimos cargar la vista general">
          {persons.error ?? cases.error}
        </Alert>
      )}

      <div className="cr-grid" style={{ "--cr-cols": 4 } as React.CSSProperties}>
        <Stat label="Solicitantes" icon={Icons.Users} value={persons.loading ? "…" : people.length} />
        <Stat
          label="Prospectos de landing sin DPI"
          icon={Icons.Globe}
          value={persons.loading ? "…" : landingWithoutDpi.length}
          help="Completa su DPI para abrirles solicitud"
        />
        <Stat label="Expedientes en armado" icon={Icons.FileText} value={cases.loading ? "…" : inAssembly.length} />
        <Stat
          label="Listos para revisión"
          icon={Icons.CheckCircle}
          value={cases.loading ? "…" : inAssembly.filter((f) => f.readyForReview).length}
          help="Checklist, evaluación y listas completos"
        />
      </div>

      <Card title="Expedientes en armado">
        {cases.loading ? (
          <Skeleton lines={4} />
        ) : (
          <DataTable
            caption="Solicitudes en borrador o devueltas, de la más reciente a la más antigua"
            onRowClick={(row: CaseFileListItem) => router.push(`/operations/${row.id}`)}
            empty={
              <EmptyState
                icon={Icons.FileText}
                title="Aún no hay expedientes en armado"
                description="Abre una solicitud desde el perfil de un solicitante."
              />
            }
            columns={[
              { key: "personName", label: "Solicitante" },
              { key: "productType", label: "Producto", render: (r: CaseFileListItem) => PRODUCT_TYPE_LABELS[r.productType] },
              { key: "amount", label: "Monto", numeric: true, render: (r: CaseFileListItem) => money(r.requestedAmount.amount) },
              {
                key: "state",
                label: "Estado",
                render: (r: CaseFileListItem) => <Badge tone={operationStateTone(r.state)}>{OPERATION_STATE_LABELS[r.state]}</Badge>,
              },
              {
                key: "gaps",
                label: "Armado",
                render: (r: CaseFileListItem) =>
                  r.readyForReview ? (
                    <Badge tone="success">Completo</Badge>
                  ) : (
                    <Badge tone="warning">{`${r.gapsCount} pendiente${r.gapsCount === 1 ? "" : "s"}`}</Badge>
                  ),
              },
            ]}
            rows={inAssembly}
          />
        )}
      </Card>
    </>
  );
}
