"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PERSON_STATUS_LABELS, PROSPECT_INTEREST_LABELS } from "@crece/shared";
import { useCrece } from "../../lib/crece-ds";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";
import { useNarrow } from "../../lib/use-narrow";

type PersonRow = {
  id: string;
  fullName: string;
  dpi: string;
  phone: string;
  status: keyof typeof PERSON_STATUS_LABELS;
  interest?: keyof typeof PROSPECT_INTEREST_LABELS;
};

export default function PersonsPage() {
  const crece = useCrece();
  const session = useSession();
  const router = useRouter();
  const narrow = useNarrow();
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ items: PersonRow[] }>("/persons", session)
      .then((payload) => setRows(payload.items))
      .catch((err: Error) => setError(err.message));
  }, [session]);

  if (!crece) return null;
  const { PageHeader, DataTable, Alert, Button, List, ListItem } = crece;

  return (
    <>
      <PageHeader
        title="Solicitantes"
        description="El DPI aparece enmascarado. La ficha se abre con el identificador, no con el documento."
        actions={<Button onClick={() => router.push("/persons/new")}>Registrar</Button>}
      />
      {error ? <Alert tone="danger" title="No se pudo cargar">{error}</Alert> : null}
      {narrow && List && ListItem ? (
        <List inset>
          {rows.map((row) => (
            <ListItem
              key={row.id}
              title={row.fullName}
              description={`${row.dpi} · ${PERSON_STATUS_LABELS[row.status]}`}
              chevron
              onClick={() => router.push(`/persons/${row.id}`)}
            />
          ))}
        </List>
      ) : (
        <DataTable
          caption="Directorio de personas"
          columns={[
            { key: "fullName", label: "Nombre" },
            { key: "dpi", label: "DPI" },
            { key: "phone", label: "Teléfono" },
            {
              key: "status",
              label: "Estado",
              render: (row: PersonRow) => PERSON_STATUS_LABELS[row.status],
            },
            {
              key: "interest",
              label: "Interés",
              render: (row: PersonRow) =>
                row.interest ? PROSPECT_INTEREST_LABELS[row.interest] : "—",
            },
          ]}
          rows={rows}
          onRowClick={(row: PersonRow) => router.push(`/persons/${row.id}`)}
          empty="Todavía no hay personas registradas."
        />
      )}
    </>
  );
}
