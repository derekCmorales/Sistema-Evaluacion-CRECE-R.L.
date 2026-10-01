"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PERSON_SOURCE_LABELS,
  PERSON_STATUS_LABELS,
  PROSPECT_INTEREST_LABELS,
  type PersonListItem,
  type PersonSource,
} from "@crece/shared";
import { useCrece } from "../../../lib/crece-ds";
import { useSession } from "../../../lib/session";
import { useApiData } from "../../../lib/use-api";
import { dateTime, personStatusTone } from "../../../lib/view";

type SourceFilter = "ALL" | PersonSource;

export default function PersonsPage() {
  const { PageHeader, Card, DataTable, Badge, Button, Alert, Skeleton, EmptyState, SearchField, SegmentedControl, Icons } =
    useCrece();
  const router = useRouter();
  const { can } = useSession();
  const [source, setSource] = React.useState<SourceFilter>("ALL");
  const [query, setQuery] = React.useState("");
  const { data, error, loading } = useApiData<{ items: PersonListItem[] }>(
    source === "ALL" ? "/persons" : `/persons?source=${source}`,
  );

  const needle = query.trim().toLowerCase();
  const rows = (data?.items ?? []).filter(
    (p) => !needle || p.fullName.toLowerCase().includes(needle) || p.dpiMasked?.endsWith(needle),
  );

  return (
    <>
      <PageHeader
        overline="Fase 1 · Registro"
        title="Solicitantes"
        description="Cada persona existe una sola vez, llegue por la landing o por la agencia. El DPI completo solo se ve en su perfil."
        actions={
          can("person:create") ? (
            <Button variant="primary" icon={Icons.Plus} onClick={() => router.push("/persons/new")}>
              Registrar solicitante
            </Button>
          ) : null
        }
      />

      <Card>
        <div className="cr-stack">
          <div className="cr-row">
            <SegmentedControl
              value={source}
              onChange={(v: SourceFilter) => setSource(v)}
              options={[
                ["ALL", "Todos"],
                ["ADVISOR", "Agencia"],
                ["LANDING", "Landing"],
              ]}
            />
            <span className="cr-spacer" />
            <SearchField
              label="Buscar solicitante"
              placeholder="Nombre o últimos 4 del DPI"
              value={query}
              onChange={(v: string) => setQuery(v)}
            />
          </div>

          {error && <Alert tone="danger" title="No pudimos cargar el directorio">{error}</Alert>}
          {loading ? (
            <Skeleton lines={5} />
          ) : (
            <DataTable
              caption="Directorio de solicitantes"
              onRowClick={(row: PersonListItem) => router.push(`/persons/${row.id}`)}
              empty={
                <EmptyState
                  icon={Icons.Users}
                  title={needle ? "Nadie coincide con la búsqueda" : "Tu primer solicitante empieza aquí"}
                  description={needle ? "Prueba con otro nombre o con los últimos 4 dígitos del DPI." : "Regístralo con su DPI para abrirle una solicitud."}
                />
              }
              columns={[
                { key: "fullName", label: "Nombre" },
                { key: "dpiMasked", label: "DPI", render: (p: PersonListItem) => p.dpiMasked ?? <Badge tone="warning">Sin DPI</Badge> },
                {
                  key: "source",
                  label: "Origen",
                  render: (p: PersonListItem) => (p.source ? PERSON_SOURCE_LABELS[p.source] : "—"),
                },
                {
                  key: "interest",
                  label: "Interés",
                  render: (p: PersonListItem) => (p.interest ? PROSPECT_INTEREST_LABELS[p.interest] : "—"),
                },
                {
                  key: "status",
                  label: "Estado",
                  render: (p: PersonListItem) => <Badge tone={personStatusTone(p.status)}>{PERSON_STATUS_LABELS[p.status]}</Badge>,
                },
                { key: "operationsCount", label: "Solicitudes", numeric: true },
                { key: "createdAt", label: "Registro", render: (p: PersonListItem) => dateTime(p.createdAt) },
              ]}
              rows={rows}
            />
          )}
        </div>
      </Card>
    </>
  );
}
