"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCrece } from "../lib/crece-ds";
import { apiPublic } from "../lib/api";

export default function HomePage() {
  const crece = useCrece();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("CREDIT");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!crece) return null;
  const { PageHeader, Card, TextField, Select, Button, Alert } = crece;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const created = await apiPublic<{ prospectId: string }>("/public/prospects", {
        fullName,
        phone,
        interest,
        consentContact: true,
        message,
      });
      router.push(`/persons/${created.prospectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    }
  }

  return (
    <>
      <PageHeader
        overline="Cooperativa CRECE Guatemala, R.L."
        title="Captación"
        description="La landing deja un prospecto. La agencia lo completa con el DPI, en la misma persona."
      />
      <Card title="Quiero que me contacten">
        <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
          {error ? <Alert tone="danger" title="Revisa los datos">{error}</Alert> : null}
          <TextField label="Nombre completo" value={fullName} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)} />
          <TextField label="Teléfono" value={phone} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)} />
          <Select
            label="Interés"
            options={[
              ["CREDIT", "Crédito"],
              ["SAVINGS", "Ahorro"],
              ["FIXED_TERM", "Plazo fijo"],
            ]}
            value={interest}
            onChange={(value: string) => setInterest(value)}
          />
          <TextField label="Mensaje" optional multiline value={message} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value)} />
          <Button type="submit" variant="accent">Enviar solicitud de contacto</Button>
        </form>
      </Card>
    </>
  );
}
