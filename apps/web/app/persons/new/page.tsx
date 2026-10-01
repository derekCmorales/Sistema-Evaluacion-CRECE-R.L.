"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCrece } from "../../../lib/crece-ds";
import { api } from "../../../lib/api";
import { useSession } from "../../../lib/session";

function NewPersonForm() {
  const crece = useCrece();
  const session = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const existingPersonId = params.get("completar") ?? "";
  const [fullName, setFullName] = useState("");
  const [dpi, setDpi] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("CREDIT");
  const [error, setError] = useState("");

  if (!crece) return null;
  const { PageHeader, Card, TextField, Select, Button, Alert } = crece;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const created = await api<{ personId: string }>("/persons", session, {
        method: "POST",
        body: JSON.stringify({
          fullName,
          dpi,
          phone,
          interest,
          source: "ADVISOR",
          registeredByUserId: session.userId,
          existingPersonId: existingPersonId || undefined,
        }),
      });
      router.push(`/persons/${created.personId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    }
  }

  return (
    <>
      <PageHeader
        title={existingPersonId ? "Completar prospecto" : "Registrar solicitante"}
        description="Toda persona nace como prospecto. Si ya vino de la landing, se completa su ficha."
      />
      <Card title="Datos de identidad">
        <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
          {error ? <Alert tone="warning" title="No se creó otra persona">{error}</Alert> : null}
          <TextField label="Nombre completo" value={fullName} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)} />
          <TextField label="DPI" help="13 dígitos. Puede llevar espacios." value={dpi} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDpi(event.target.value)} />
          <TextField label="Teléfono" value={phone} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)} />
          <Select
            label="Interés"
            value={interest}
            onChange={(value: string) => setInterest(value)}
            options={[
              ["CREDIT", "Crédito"],
              ["SAVINGS", "Ahorro"],
              ["FIXED_TERM", "Plazo fijo"],
            ]}
          />
          <Button type="submit">Guardar persona</Button>
        </form>
      </Card>
    </>
  );
}

export default function NewPersonPage() {
  return (
    <Suspense fallback={null}>
      <NewPersonForm />
    </Suspense>
  );
}
