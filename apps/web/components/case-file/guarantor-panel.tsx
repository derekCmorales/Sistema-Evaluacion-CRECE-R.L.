"use client";

import * as React from "react";
import { useCrece } from "../../lib/crece-ds";
import { dpiDigits, optionalAmount } from "../../lib/view";
import { useCaseAction, type CasePanelProps } from "./use-case-action";

type Form = {
  fullName: string;
  dpi: string;
  phone: string;
  relationship: string;
  monthlyIncome: number | "";
  monthlyExpenses: number | "";
  existingDebtPayment: number | "";
  guaranteeValue: number | "";
};

/** C-05b: fiador flexible; basta el nombre y la evaluación se completa cuando llegue. */
export function GuarantorPanel({ caseFile, canEdit, onSaved }: CasePanelProps) {
  const { Card, TextField, CurrencyField, Button, Alert, Overline } = useCrece();
  const { operation } = caseFile;
  const { run, pending, error } = useCaseAction(operation.id, onSaved);
  const g = operation.guarantor;
  const a = operation.guarantorAssessment;
  const [form, setForm] = React.useState<Form>({
    fullName: g?.fullName ?? "",
    dpi: g?.dpi ?? "",
    phone: g?.phone ?? "",
    relationship: g?.relationship ?? "",
    monthlyIncome: a?.monthlyIncome ?? "",
    monthlyExpenses: a?.monthlyExpenses ?? "",
    existingDebtPayment: a?.existingDebtPayment ?? "",
    guaranteeValue: a?.guaranteeValue ?? "",
  });
  const text = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const amount = (key: keyof Form) => (n: number | "") => setForm((f) => ({ ...f, [key]: n }));

  const hasAssessment = form.monthlyIncome !== "" || form.monthlyExpenses !== "" || form.existingDebtPayment !== "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void run("/guarantor", "PUT", {
      fullName: form.fullName,
      dpi: form.dpi ? dpiDigits(form.dpi) : undefined,
      phone: form.phone || undefined,
      relationship: form.relationship || undefined,
      financialAssessment: hasAssessment
        ? {
            monthlyIncome: form.monthlyIncome,
            monthlyExpenses: form.monthlyExpenses,
            existingDebtPayment: form.existingDebtPayment,
            guaranteeValue: optionalAmount(form.guaranteeValue),
          }
        : undefined,
    });
  }

  return (
    <Card title="Fiador">
      <form className="cr-stack" onSubmit={submit} noValidate>
        {!operation.hasGuarantor && (
          <Alert tone="info" title="Esta solicitud no lleva fiador">
            Si lo agregas, el checklist suma el DPI, los ingresos y el buró del fiador.
          </Alert>
        )}
        <div className="cr-grid">
          <TextField label="Nombre completo" autoComplete="off" value={form.fullName} onChange={text("fullName")} />
          <TextField label="DPI" optional inputMode="numeric" autoComplete="off" help="13 dígitos" value={form.dpi} onChange={text("dpi")} />
          <TextField label="Teléfono" optional inputMode="tel" value={form.phone} onChange={text("phone")} />
          <TextField label="Parentesco o relación" optional value={form.relationship} onChange={text("relationship")} />
        </div>

        <Overline>Evaluación del fiador · capturado</Overline>
        <div className="cr-grid">
          <CurrencyField label="Ingresos mensuales" value={form.monthlyIncome} onChange={amount("monthlyIncome")} />
          <CurrencyField label="Gastos mensuales" value={form.monthlyExpenses} onChange={amount("monthlyExpenses")} />
          <CurrencyField label="Cuota de deudas actuales" value={form.existingDebtPayment} onChange={amount("existingDebtPayment")} />
          <CurrencyField label="Valor de su garantía" help="Opcional" value={form.guaranteeValue} onChange={amount("guaranteeValue")} />
        </div>

        {error && <Alert tone="danger" title="No se guardó el fiador">{error}</Alert>}
        {canEdit && (
          <div className="form-actions">
            <Button variant="primary" type="submit" loading={pending} disabled={pending}>
              {operation.hasGuarantor && g ? "Actualizar fiador" : "Agregar fiador"}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
