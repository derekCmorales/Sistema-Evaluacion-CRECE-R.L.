"use client";

import { useState } from "react";
import { formatGtq } from "@crece/shared";
import { useCrece } from "../../lib/crece-ds";
import { api } from "../../lib/api";
import { useSession } from "../../lib/session";

export default function CalcPage() {
  const crece = useCrece();
  const session = useSession();
  const [amount, setAmount] = useState(25000);
  const [termMonths, setTermMonths] = useState("18");
  const [income, setIncome] = useState("12000");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  if (!crece) return null;
  const { PageHeader, Card, CurrencyField, TextField, Button, Alert } = crece;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const payload = await api<{
        calcResult: { installment: { amount: number } };
      }>("/operations/calc", session, {
        method: "POST",
        body: JSON.stringify({
          amount,
          termMonths: Number(termMonths),
          purpose: "Simulación",
          assessment: {
            monthlySales: Number(income),
            monthlyIncome: Number(income),
            monthlyExpenses: 0,
            existingDebtPayment: 0,
          },
        }),
      });
      setResult(formatGtq(payload.calcResult.installment.amount));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo calcular");
    }
  }

  return (
    <>
      <PageHeader title="Simulador" description="La cuota la calcula el motor. Aquí no hay puntaje ni recomendación." />
      <Card title="Datos">
        <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
          {error ? <Alert tone="danger" title="No se calculó">{error}</Alert> : null}
          {result ? <Alert tone="info" title="Cuota calculada">{result}</Alert> : null}
          <CurrencyField label="Monto" value={amount} onChange={(value: number) => setAmount(value)} currency="GTQ" />
          <TextField label="Plazo en meses" value={termMonths} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTermMonths(event.target.value)} />
          <TextField label="Ingreso mensual" value={income} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setIncome(event.target.value)} />
          <Button type="submit">Calcular cuota</Button>
        </form>
      </Card>
    </>
  );
}
