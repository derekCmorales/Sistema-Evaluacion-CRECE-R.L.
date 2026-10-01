"use client";

import * as React from "react";
import type { FinancialAssessmentInput } from "@crece/domain";
import { useCrece } from "../../lib/crece-ds";
import { optionalAmount } from "../../lib/view";
import { CalcResults } from "../calc-results";
import { useCaseAction, type CasePanelProps } from "./use-case-action";

type Form = {
  monthlySales: number | "";
  monthlyIncome: number | "";
  monthlyExpenses: number | "";
  existingDebtPayment: number | "";
  guaranteeValue: number | "";
  projectedRoiPercent: string;
};

function fromAssessment(a?: FinancialAssessmentInput): Form {
  return {
    monthlySales: a?.monthlySales ?? "",
    monthlyIncome: a?.monthlyIncome ?? "",
    monthlyExpenses: a?.monthlyExpenses ?? "",
    existingDebtPayment: a?.existingDebtPayment ?? "",
    guaranteeValue: a?.guaranteeValue ?? "",
    projectedRoiPercent: a?.projectedRoiPercent === undefined ? "" : String(a.projectedRoiPercent),
  };
}

/**
 * C-05: captura manual (registro «capturado») y resultado del motor (registro «calculado»).
 * La pantalla no calcula nada: muestra lo que devuelve la API. Sin puntaje ni recomendación.
 */
export function AssessmentPanel({ caseFile, canEdit, onSaved }: CasePanelProps) {
  const { Card, CurrencyField, TextField, Button, Alert, Overline } = useCrece();
  const { operation } = caseFile;
  const { run, pending, error } = useCaseAction(operation.id, onSaved);
  const [form, setForm] = React.useState<Form>(() => fromAssessment(operation.assessment));
  const set = (key: keyof Form) => (value: number | "") => setForm((f) => ({ ...f, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void run("/assessment", "PUT", {
      ...form,
      guaranteeValue: optionalAmount(form.guaranteeValue),
      projectedRoiPercent: form.projectedRoiPercent.trim() === "" ? undefined : form.projectedRoiPercent,
    });
  }

  const calc = operation.calcResult;

  return (
    <div className="cr-stack">
      <Card title="Evaluación financiera del solicitante">
        <form className="cr-stack" onSubmit={submit} noValidate>
          <Overline>Capturado por el asesor</Overline>
          <div className="cr-grid">
            <CurrencyField label="Ventas mensuales" value={form.monthlySales} onChange={set("monthlySales")} />
            <CurrencyField label="Ingresos mensuales" value={form.monthlyIncome} onChange={set("monthlyIncome")} />
            <CurrencyField label="Gastos mensuales" value={form.monthlyExpenses} onChange={set("monthlyExpenses")} />
            <CurrencyField label="Cuota de deudas actuales" value={form.existingDebtPayment} onChange={set("existingDebtPayment")} />
            <CurrencyField label="Valor de la garantía" help="Opcional" value={form.guaranteeValue} onChange={set("guaranteeValue")} />
            <TextField
              label="ROI proyectado"
              optional
              suffix="%"
              inputMode="decimal"
              value={form.projectedRoiPercent}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, projectedRoiPercent: e.target.value }))}
            />
          </div>
          {error && <Alert tone="danger" title="No se guardó la evaluación">{error}</Alert>}
          {canEdit && (
            <div className="form-actions">
              <Button variant="primary" type="submit" loading={pending} disabled={pending}>
                {operation.assessment ? "Actualizar y recalcular" : "Guardar y calcular"}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {calc && (
        <Card title="Resultado del motor" variant="tinted">
          <CalcResults calc={calc} hits={operation.hardRuleHits} termMonths={operation.termMonths} />
          <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
            Las excepciones justificadas a reglas duras llegan en la fase 4.
          </p>
        </Card>
      )}
    </div>
  );
}
