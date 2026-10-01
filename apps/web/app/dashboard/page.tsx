"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCrece } from "../../lib/crece-ds";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";

export default function DashboardPage() {
  const crece = useCrece();
  const session = useSession();
  const router = useRouter();
  const [people, setPeople] = useState(0);
  const [drafts, setDrafts] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ items: unknown[] }>("/persons", session),
      api<{ items: { state: string }[] }>("/operations", session),
    ])
      .then(([persons, operations]) => {
        setPeople(persons.items.length);
        setDrafts(operations.items.filter((item) => item.state === "DRAFT").length);
      })
      .catch((err: Error) => setError(err.message));
  }, [session]);

  if (!crece) return null;
  const { PageHeader, Stat, Card, Button, Alert } = crece;

  return (
    <>
      <PageHeader
        title="Panel"
        description="Colas de captación. El cargo de la barra cambia lo que puedes hacer."
      />
      {error ? <Alert tone="danger" title="Sin acceso">{error}</Alert> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
        <Stat label="Personas" value={String(people)} />
        <Stat label="Borradores" value={String(drafts)} />
      </div>
      <Card title="Seguir">
        <Button variant="secondary" onClick={() => router.push("/persons")}>Ver solicitantes</Button>
      </Card>
    </>
  );
}
