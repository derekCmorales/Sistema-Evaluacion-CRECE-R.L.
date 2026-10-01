"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OPERATION_STATE_LABELS, PERSON_STATUS_LABELS } from "@crece/shared";
import { hasPermission } from "@crece/application";
import { useCrece } from "../../../lib/crece-ds";
import { api } from "../../../lib/api";
import { useSession } from "../../../lib/session";

type PersonDetail = {
  id: string;
  fullName: string;
  dpi?: string;
  status: keyof typeof PERSON_STATUS_LABELS;
  contacts: { phone: string; email?: string };
  operations: { id: string; state: keyof typeof OPERATION_STATE_LABELS; purpose: string }[];
};

export default function PersonDetailPage() {
  const crece = useCrece();
  const session = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [error, setError] = useState("");
  const canOpen = hasPermission(session.offices, "operation:create");

  useEffect(() => {
    api<PersonDetail>(`/persons/${params.id}`, session)
      .then(setPerson)
      .catch((err: Error) => setError(err.message));
  }, [params.id, session]);

  if (!crece) return null;
  const { PageHeader, Card, DescriptionList, Button, Alert, DataTable, Badge } = crece;

  return (
    <>
      <PageHeader
        title={person?.fullName ?? "Persona"}
        description="El identificador de la ficha no es el DPI."
        actions={
          person ? (
            <>
              {!person.dpi ? (
                <Button variant="secondary" onClick={() => router.push(`/persons/new?completar=${person.id}`)}>
                  Completar con DPI
                </Button>
              ) : null}
              <Button
                disabled={!canOpen || !person.dpi}
                onClick={() => router.push(`/operations/new?personId=${person.id}`)}
              >
                Abrir borrador
              </Button>
            </>
          ) : null
        }
      />
      {error ? <Alert tone="danger" title="No se encontró">{error}</Alert> : null}
      {person ? (
        <>
          <Card title="Identidad">
            <DescriptionList
              items={[
                ["Estado", PERSON_STATUS_LABELS[person.status]],
                ["DPI", person.dpi ?? "Pendiente"],
                ["Teléfono", person.contacts.phone],
              ]}
            />
            {!person.dpi ? (
              <Badge tone="warning">Prospecto sin DPI</Badge>
            ) : null}
          </Card>
          <DataTable
            caption="Expedientes"
            columns={[
              { key: "purpose", label: "Destino" },
              {
                key: "state",
                label: "Estado",
                render: (row: PersonDetail["operations"][number]) =>
                  OPERATION_STATE_LABELS[row.state],
              },
            ]}
            rows={person.operations}
            onRowClick={(row: { id: string }) => router.push(`/operations/${row.id}`)}
            empty="Esta persona todavía no tiene expedientes."
          />
        </>
      ) : null}
    </>
  );
}
