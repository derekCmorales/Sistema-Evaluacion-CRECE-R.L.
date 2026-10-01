"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCrece } from "../../../lib/crece-ds";
import { api } from "../../../lib/api";
import { useSession } from "../../../lib/session";

type ChecklistPreview = { code: string; label: string; required: boolean };

function OpenDraftForm() {
  const crece = useCrece();
  const session = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [personId, setPersonId] = useState(params.get("personId") ?? "");
  const [productType, setProductType] = useState("WORKING_CAPITAL");
  const [guaranteeType, setGuaranteeType] = useState("PERSONAL");
  const [amount, setAmount] = useState(25000);
  const [termMonths, setTermMonths] = useState("18");
  const [purpose, setPurpose] = useState("");
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [preview, setPreview] = useState<ChecklistPreview[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({
      productType,
      guaranteeType,
      hasGuarantor: String(hasGuarantor),
    });
    api<{ items: ChecklistPreview[] }>(`/operations/checklist?${query}`, session)
      .then((payload) => setPreview(payload.items))
      .catch(() => setPreview([]));
  }, [productType, guaranteeType, hasGuarantor, session]);

  if (!crece) return null;
  const { PageHeader, Card, TextField, Select, CurrencyField, Switch, Button, Alert, List, ListItem } = crece;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const created = await api<{ operationId: string }>("/operations", session, {
        method: "POST",
        body: JSON.stringify({
          personId,
          productType,
          guaranteeType,
          requestedAmount: amount,
          termMonths: Number(termMonths),
          purpose,
          hasGuarantor,
          createdBy: session.userId,
        }),
      });
      router.push(`/operations/${created.operationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir");
    }
  }

  return (
    <>
      <PageHeader
        title="Abrir borrador"
        description="La persona tiene que existir y tener DPI. Si no, el expediente no se crea."
      />
      <Card title="Solicitud">
        <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
          {error ? <Alert tone="danger" title="No se abrió el borrador">{error}</Alert> : null}
          <TextField label="Identificador de la persona" value={personId} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPersonId(event.target.value)} />
          <Select
            label="Producto"
            value={productType}
            onChange={(value: string) => setProductType(value)}
            options={[
              ["WORKING_CAPITAL", "Capital de trabajo"],
              ["INVESTMENT", "Inversión"],
              ["MICROCREDIT", "Microcrédito"],
            ]}
          />
          <Select
            label="Garantía"
            value={guaranteeType}
            onChange={(value: string) => setGuaranteeType(value)}
            options={[
              ["PERSONAL", "Fiduciaria"],
              ["MORTGAGE", "Hipotecaria"],
              ["PLEDGE", "Prendaria"],
              ["MIXED", "Mixta"],
            ]}
          />
          <CurrencyField label="Monto solicitado" value={amount} onChange={(value: number) => setAmount(value)} currency="GTQ" />
          <TextField label="Plazo en meses" value={termMonths} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTermMonths(event.target.value)} />
          <TextField label="Destino" value={purpose} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPurpose(event.target.value)} />
          <Switch label="Lleva fiador" checked={hasGuarantor} onChange={(checked: boolean) => setHasGuarantor(checked)} />
          <Button type="submit">Crear borrador</Button>
        </form>
      </Card>
      <Card title="Requisitos que se van a pedir">
        <List>
          {preview.map((item) => (
            <ListItem key={item.code} title={item.label} description={item.required ? "Obligatorio" : "Opcional"} />
          ))}
        </List>
      </Card>
    </>
  );
}

export default function OpenDraftPage() {
  return (
    <Suspense fallback={null}>
      <OpenDraftForm />
    </Suspense>
  );
}
