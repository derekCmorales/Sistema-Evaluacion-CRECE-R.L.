"use client";

import * as React from "react";
import type { CalcResult, HardRuleHit } from "@crece/domain";
import { useCrece } from "../../../lib/crece-ds";
import { apiRequest, errorMessage } from "../../../lib/api";
import { optionalAmount } from "../../../lib/view";
import { CalcResults } from "../../../components/calc-results";

type Form = {
  amount: number | "";
  termMonths: number;
  monthlySales: number | "";
  monthlyIncome: number | "";
  monthlyExpenses: number | "";
  existingDebtPayment: number | "";
  guaranteeValue: number | "";
};

/** Simulador: el mismo motor del expediente, sin guardar nada. Ejemplo: Don Marco, Q40,000 a 24 meses. */
export default function CalcPage() {
  const { PageHeader, Card, CurrencyField, NumberStepper, TextField, Button, Alert } = useCrece();
  const [form, setForm] = React.useState<Form>({
    amount: 40000,
    termMonths: 24,
    monthlySales: 45000,
    monthlyIncome: 18000,
    monthlyExpenses: 9000,
    existingDebtPayment: 1500,
    guaranteeValue: 80000,
  });
  const [purpose, setPurpose] = React.useState("Capital de trabajo ferretería");
  const [result, setResult] = React.useState<{ calcResult: CalcResult; hardRuleHits: HardRuleHit[] } | null>(null);
  const [error, setError] = React.useState<string>();
  const [pending, setPending] = React.useState(false);
  const set = (key: keyof Form) => (n: number | "") => setForm((f) => ({ ...f, [key]: n }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      setResult(
        await apiRequest("/operations/calc", {
          method: "POST",
          body: {
            amount: form.amount,
            termMonths: form.termMonths,
            purpose,
            assessment: {
              monthlySales: form.monthlySales,
              monthlyIncome: form.monthlyIncome,
              monthlyExpenses: form.monthlyExpenses,
              existingDebtPayment: form.existingDebtPayment,
              guaranteeValue: optionalAmount(form.guaranteeValue),
            },
          },
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        overline="Herramientas"
        title="Simulador de cuota"
        description="Usa el motor de cálculo del expediente sin guardar nada. La tasa es la semilla configurada."
      />
      <div className="layout-detail">
        <Card>
          <form className="cr-stack" onSubmit={submit} noValidate>
            <div className="cr-grid">
              <CurrencyField label="Monto" value={form.amount} onChange={set("amount")} />
              <div className="cr-stack">
                <span className="label-md">Plazo</span>
                <NumberStepper
                  label="Plazo en meses"
                  value={form.termMonths}
                  min={1}
                  max={120}
                  onChange={(n: number) => setForm((f) => ({ ...f, termMonths: n }))}
                  format={(n: number) => `${n} meses`}
                />
              </div>
              <CurrencyField label="Ventas mensuales" value={form.monthlySales} onChange={set("monthlySales")} />
              <CurrencyField label="Ingresos mensuales" value={form.monthlyIncome} onChange={set("monthlyIncome")} />
              <CurrencyField label="Gastos mensuales" value={form.monthlyExpenses} onChange={set("monthlyExpenses")} />
              <CurrencyField label="Cuota de deudas actuales" value={form.existingDebtPayment} onChange={set("existingDebtPayment")} />
              <CurrencyField label="Valor de la garantía" help="Opcional" value={form.guaranteeValue} onChange={set("guaranteeValue")} />
            </div>
            <TextField
              label="Destino"
              value={purpose}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPurpose(e.target.value)}
            />
            {error && <Alert tone="danger" title="No pudimos calcular">{error}</Alert>}
            <div className="form-actions">
              <Button variant="primary" type="submit" loading={pending} disabled={pending}>
                Calcular
              </Button>
            </div>
          </form>
        </Card>
        <Card title="Resultado" variant="tinted">
          {result ? (
            <CalcResults calc={result.calcResult} hits={result.hardRuleHits} termMonths={form.termMonths} />
          ) : (
            <p className="body-md" style={{ color: "var(--text-secondary)" }}>
              Completa los datos y calcula para ver cuota, capacidad, cobertura y amortización.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
