"use client";

import type { CalcResult, HardRuleHit } from "@crece/domain";
import { useCrece } from "../lib/crece-ds";
import { hardRuleTone, money, percent, toAmortizationRows } from "../lib/view";

/** Registro «calculado»: lo que devuelve el motor determinístico. Nunca un puntaje ni una recomendación. */
export function CalcResults({ calc, hits, termMonths }: { calc: CalcResult; hits: HardRuleHit[]; termMonths: number }) {
  const { Stat, Overline, Alert, Accordion, AmortizationTable } = useCrece();
  return (
    <div className="cr-stack">
      <Overline>Calculado · determinístico</Overline>
      <div className="cr-grid" style={{ "--cr-cols": 3 } as React.CSSProperties}>
        <Stat label="Cuota mensual" value={money(calc.installment.amount)} />
        <Stat label="Capacidad de pago" value={money(calc.paymentCapacity.amount)} />
        <Stat label="Cuota sobre ingresos" value={percent(calc.installmentToIncomeRatio)} />
        <Stat label="Cobertura de garantía" value={calc.guaranteeCoverage === null ? "—" : `${calc.guaranteeCoverage.toFixed(2)}×`} />
        <Stat label="ROI" value={calc.roiPercent === null ? "—" : `${calc.roiPercent.toFixed(1)}%`} />
        <Stat label="Plazo" value={`${termMonths} meses`} />
      </div>

      {hits.length === 0 ? (
        <Alert tone="success" title="Sin alertas de reglas duras">
          Ninguna regla configurada se activó con estos datos.
        </Alert>
      ) : (
        hits.map((hit) => (
          <Alert key={hit.ruleCode} tone={hardRuleTone(hit.severity)} title={hit.severity === "BLOCK" ? "Regla dura: bloquea" : "Regla dura: alerta"}>
            {hit.message}
          </Alert>
        ))
      )}

      <Accordion
        items={[{ title: "Tabla de amortización", content: <AmortizationTable schedule={toAmortizationRows(calc.amortizationSchedule)} /> }]}
      />
      <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
        Huella de los datos: {calc.inputsHash.slice(0, 12)}…
      </p>
    </div>
  );
}
