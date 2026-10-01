"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  OPERATION_STATE_LABELS,
  PERSON_SOURCE_LABELS,
  PERSON_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  PROSPECT_INTEREST_LABELS,
  formatDpi,
  type OperationListItem,
} from "@crece/shared";
import { useCrece } from "../../../../lib/crece-ds";
import { useSession } from "../../../../lib/session";
import { useApiData } from "../../../../lib/use-api";
import { ApiError, errorMessage } from "../../../../lib/api";
import type { PersonProfile } from "../../../../lib/types";
import { dateTime, dpiDigits, money, operationStateTone, personStatusTone } from "../../../../lib/view";

export default function PersonProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { PageHeader, Breadcrumbs, Card, DescriptionList, DataTable, Badge, Button, Alert, Skeleton, EmptyState, TextField, Icons } =
    useCrece();
  const router = useRouter();
  const { can, request } = useSession();
  const { data, error, loading, setData } = useApiData<PersonProfile>(`/persons/${id}`);
  const [dpi, setDpi] = React.useState("");
  const [dpiError, setDpiError] = React.useState<string>();
  const [saving, setSaving] = React.useState(false);

  async function completeDpi(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setDpiError(undefined);
    try {
      const person = await request<PersonProfile["person"]>(`/persons/${id}/dpi`, { method: "PUT", body: { dpi: dpiDigits(dpi) } });
      setData((current) => (current ? { ...current, person } : current));
    } catch (err) {
      if (err instanceof ApiError && err.code === "DUPLICATE_PERSON" && err.existingPersonId) {
        setDpiError("Ese DPI ya pertenece a otra persona registrada. Revisa si es la misma y continúa desde su perfil.");
      } else {
        setDpiError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  const breadcrumbs = <Breadcrumbs items={[{ label: "Solicitantes", href: "/persons" }, { label: data?.person.fullName ?? "Perfil" }]} />;

  if (error) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} title="Perfil del solicitante" />
        <Alert tone="danger" title="No pudimos abrir el perfil">{error}</Alert>
      </>
    );
  }
  if (loading || !data) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} title="Perfil del solicitante" />
        <Skeleton lines={6} />
      </>
    );
  }

  const { person, operations } = data;
  const canOpen = can("operation:create") && Boolean(person.dpi);

  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        overline="Fase 1 · Perfil"
        title={person.fullName}
        description="Una persona, todas sus solicitudes. Producto, garantía y destino los define el asesor al abrir la solicitud."
        actions={
          <>
            <Badge tone={personStatusTone(person.status)}>{PERSON_STATUS_LABELS[person.status]}</Badge>
            {can("operation:create") && (
              <Button
                variant="primary"
                icon={Icons.FileText}
                disabled={!canOpen}
                onClick={() => router.push(`/operations/new?personId=${person.id}`)}
              >
                Abrir solicitud
              </Button>
            )}
          </>
        }
      />

      <div className="layout-detail">
        <div className="cr-stack">
          {!person.dpi && (
            <Card title="Completa la identidad">
              <form className="cr-stack" onSubmit={completeDpi} noValidate>
                <Alert tone="warning" title="Llegó por la landing sin DPI">
                  Sin DPI no se abre solicitud. Al completarlo verificamos que no exista ya otra persona con ese DPI.
                </Alert>
                {can("person:create") ? (
                  <>
                    <TextField
                      label="DPI"
                      help="13 dígitos"
                      inputMode="numeric"
                      autoComplete="off"
                      value={dpi}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDpi(e.target.value)}
                      error={dpiError}
                    />
                    <div className="form-actions">
                      <Button variant="primary" type="submit" loading={saving} disabled={saving}>
                        Guardar DPI
                      </Button>
                    </div>
                  </>
                ) : null}
              </form>
            </Card>
          )}

          <Card title="Historial de solicitudes">
            <DataTable
              caption="Solicitudes de esta persona, de la más reciente a la más antigua"
              onRowClick={(row: OperationListItem) => router.push(`/operations/${row.id}`)}
              empty={
                <EmptyState
                  icon={Icons.FileText}
                  title="Aún no tiene solicitudes"
                  description={person.dpi ? "Ábrele la primera cuando definan producto y destino." : "Completa su DPI para abrirle una solicitud."}
                />
              }
              columns={[
                { key: "productType", label: "Producto", render: (o: OperationListItem) => PRODUCT_TYPE_LABELS[o.productType] },
                { key: "amount", label: "Monto", numeric: true, render: (o: OperationListItem) => money(o.requestedAmount.amount) },
                { key: "termMonths", label: "Plazo", numeric: true, render: (o: OperationListItem) => `${o.termMonths} meses` },
                {
                  key: "state",
                  label: "Estado",
                  render: (o: OperationListItem) => <Badge tone={operationStateTone(o.state)}>{OPERATION_STATE_LABELS[o.state]}</Badge>,
                },
                { key: "createdAt", label: "Apertura", render: (o: OperationListItem) => dateTime(o.createdAt) },
              ]}
              rows={operations}
            />
          </Card>
        </div>

        <Card title="Datos del solicitante">
          <DescriptionList
            items={[
              ["DPI", person.dpi ? formatDpi(person.dpi) : "Pendiente"],
              ["Teléfono", person.contacts.phone],
              ["Correo", person.contacts.email ?? "—"],
              ["Interés", person.interest ? PROSPECT_INTEREST_LABELS[person.interest] : "—"],
              ["Origen", person.source ? PERSON_SOURCE_LABELS[person.source] : "—"],
              ["Registró", person.registeredByUserId ?? (person.source === "LANDING" ? "Formulario público" : "—")],
              ["Fecha de registro", dateTime(person.createdAt)],
              ...(person.intakeNote?.message ? ([["Mensaje en la landing", person.intakeNote.message]] as [string, string][]) : []),
              ...(person.intakeNote?.amountHint
                ? ([["Monto que mencionó", money(person.intakeNote.amountHint)]] as [string, string][])
                : []),
            ]}
          />
        </Card>
      </div>
    </>
  );
}
