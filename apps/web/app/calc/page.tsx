"use client";

import { FormEvent, useState } from "react";
import { CreceAppShell } from "@/components/crece-ui";
import { IconCoins, IconWarningCircle } from "@/components/icons";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type CalcResponse = {
  calcResult: {
    installment: { amount: string };
    paymentCapacity: { amount: string };
    installmentToIncomeRatio: number;
    guaranteeCoverage: number | null;
    amortizationSchedule: unknown[];
  };
  hardRuleHits: Array<{ ruleCode: string; severity: string; message: string }>;
};

export default function CalcDemoPage() {
  const [result, setResult] = useState<CalcResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const amountVal = Number(form.get("amount"));
    const termMonthsVal = Number(form.get("termMonths"));
    const rateVal = Number(form.get("annualRatePercent"));
    const incomeVal = Number(form.get("monthlyIncome"));
    const expensesVal = Number(form.get("monthlyExpenses"));
    const purposeVal = String(form.get("purpose") ?? "").trim();

    const errors: Record<string, string> = {};
    if (!amountVal || amountVal <= 0) errors.amount = "El monto solicitado debe ser mayor a Q0.00";
    if (!termMonthsVal || termMonthsVal <= 0) errors.termMonths = "El plazo debe ser mayor a 0 meses";
    if (!rateVal || rateVal <= 0) errors.annualRatePercent = "La tasa anual debe ser mayor a 0%";
    if (!incomeVal || incomeVal <= 0) errors.monthlyIncome = "El ingreso mensual debe ser mayor a Q0.00";
    if (!expensesVal || expensesVal < 0) errors.monthlyExpenses = "Los gastos mensuales deben ser mayor o igual a Q0.00";
    if (!purposeVal) errors.purpose = "El destino del crédito es requerido";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(
        Object.keys(errors).length === 1
          ? "Se encontró 1 campo con datos pendientes. Verifique el aviso sobre el campo."
          : `Se encontraron ${Object.keys(errors).length} campos con datos requeridos. Por favor verifique las indicaciones sobre cada campo.`
      );
      return;
    }

    setPending(true);

    const body = {
      amount: amountVal,
      termMonths: termMonthsVal,
      annualRatePercent: rateVal,
      purpose: purposeVal,
      assessment: {
        monthlySales: Number(form.get("monthlySales")),
        monthlyIncome: incomeVal,
        monthlyExpenses: expensesVal,
        existingDebtPayment: Number(form.get("existingDebtPayment")),
        guaranteeValue: Number(form.get("guaranteeValue")),
      },
    };
    try {
      const res = await fetch(`${api}/operations/calc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as CalcResponse & { message?: string };
      if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
      setResult(json);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Error al procesar el cálculo");
    } finally {
      setPending(false);
    }
  }


  return (
    <CreceAppShell
      activeItem="calc"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Simulador de crédito" },
      ]}
    >
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <div className="cr-overline cr-overline--rule mb-2">
            Herramienta Financiera
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Simulador de Crédito
          </h1>
          <p
            className="text-sm mt-1 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Herramienta institucional para estimación de cuota, capacidad de pago y análisis de cobertura de garantías conforme a políticas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="cr-card cr-card--elevated p-6">
            <h2
              className="text-base font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Parámetros de la Operación
            </h2>
            <form onSubmit={onSubmit} className="flex flex-col gap-4 text-sm">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Monto GTQ
                </label>
                {fieldErrors.amount && (
                  <div
                    className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 mb-1.5 rounded text-xs font-semibold"
                    style={{
                      background: "var(--danger-bg)",
                      color: "var(--danger)",
                      border: "1px solid var(--danger)",
                    }}
                    role="alert"
                  >
                    <IconWarningCircle size={14} className="flex-shrink-0" />
                    <span>{fieldErrors.amount}</span>
                  </div>
                )}
                <input
                  name="amount"
                  defaultValue={40000}
                  type="number"
                  className="cr-input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Plazo (meses)
                  </label>
                  {fieldErrors.termMonths && (
                    <div
                      className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 mb-1.5 rounded text-xs font-semibold"
                      style={{
                        background: "var(--danger-bg)",
                        color: "var(--danger)",
                        border: "1px solid var(--danger)",
                      }}
                      role="alert"
                    >
                      <IconWarningCircle size={14} className="flex-shrink-0" />
                      <span>{fieldErrors.termMonths}</span>
                    </div>
                  )}
                  <input
                    name="termMonths"
                    defaultValue={24}
                    type="number"
                    className="cr-input w-full"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Tasa anual %
                  </label>
                  {fieldErrors.annualRatePercent && (
                    <div
                      className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 mb-1.5 rounded text-xs font-semibold"
                      style={{
                        background: "var(--danger-bg)",
                        color: "var(--danger)",
                        border: "1px solid var(--danger)",
                      }}
                      role="alert"
                    >
                      <IconWarningCircle size={14} className="flex-shrink-0" />
                      <span>{fieldErrors.annualRatePercent}</span>
                    </div>
                  )}
                  <input
                    name="annualRatePercent"
                    defaultValue={18}
                    type="number"
                    className="cr-input w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Ingreso mensual (Q)
                  </label>
                  {fieldErrors.monthlyIncome && (
                    <div
                      className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 mb-1.5 rounded text-xs font-semibold"
                      style={{
                        background: "var(--danger-bg)",
                        color: "var(--danger)",
                        border: "1px solid var(--danger)",
                      }}
                      role="alert"
                    >
                      <IconWarningCircle size={14} className="flex-shrink-0" />
                      <span>{fieldErrors.monthlyIncome}</span>
                    </div>
                  )}
                  <input
                    name="monthlyIncome"
                    defaultValue={18000}
                    type="number"
                    className="cr-input w-full"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Ventas mensuales (Q)
                  </label>
                  <input
                    name="monthlySales"
                    defaultValue={45000}
                    type="number"
                    className="cr-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Gastos mensuales (Q)
                  </label>
                  {fieldErrors.monthlyExpenses && (
                    <div
                      className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 mb-1.5 rounded text-xs font-semibold"
                      style={{
                        background: "var(--danger-bg)",
                        color: "var(--danger)",
                        border: "1px solid var(--danger)",
                      }}
                      role="alert"
                    >
                      <IconWarningCircle size={14} className="flex-shrink-0" />
                      <span>{fieldErrors.monthlyExpenses}</span>
                    </div>
                  )}
                  <input
                    name="monthlyExpenses"
                    defaultValue={9000}
                    type="number"
                    className="cr-input w-full"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Deuda existente (Q)
                  </label>
                  <input
                    name="existingDebtPayment"
                    defaultValue={1500}
                    type="number"
                    className="cr-input w-full"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Valor de garantía (Q)
                </label>
                <input
                  name="guaranteeValue"
                  defaultValue={80000}
                  type="number"
                  className="cr-input w-full"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Destino del crédito
                </label>
                {fieldErrors.purpose && (
                  <div
                    className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 mb-1.5 rounded text-xs font-semibold"
                    style={{
                      background: "var(--danger-bg)",
                      color: "var(--danger)",
                      border: "1px solid var(--danger)",
                    }}
                    role="alert"
                  >
                    <IconWarningCircle size={14} className="flex-shrink-0" />
                    <span>{fieldErrors.purpose}</span>
                  </div>
                )}
                <input
                  name="purpose"
                  defaultValue="Capital de trabajo ferretería"
                  className="cr-input w-full"
                />
              </div>


              <button
                type="submit"
                disabled={pending}
                className="cr-btn cr-btn--primary w-full mt-2"
              >
                {pending ? "Calculando..." : "Calcular cuota y capacidad"}
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4">
            {error && (
              <div
                className="p-4 rounded-lg text-sm"
                style={{
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  border: "1px solid var(--danger)",
                }}
              >
                {error}
              </div>
            )}

            {result ? (
              <div className="cr-card cr-card--elevated p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2
                    className="text-base font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Resultado del Cálculo
                  </h2>
                  <span className="cr-badge cr-badge--success cr-badge--pill">
                    Calculado
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-md"
                    style={{ background: "var(--bg-muted)" }}
                  >
                    <span
                      className="block text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Cuota Estimada
                    </span>
                    <strong
                      className="text-lg font-bold"
                      style={{ color: "var(--brand)" }}
                    >
                      Q{result.calcResult.installment.amount}
                    </strong>
                  </div>

                  <div
                    className="p-3 rounded-md"
                    style={{ background: "var(--bg-muted)" }}
                  >
                    <span
                      className="block text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Capacidad de Pago
                    </span>
                    <strong
                      className="text-lg font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Q{result.calcResult.paymentCapacity.amount}
                    </strong>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 text-sm pt-2 border-t border-[var(--border-default)]">
                  <li className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Ratio cuota / ingreso:
                    </span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {(result.calcResult.installmentToIncomeRatio * 100).toFixed(1)}%
                    </strong>
                  </li>
                  <li className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Cobertura de garantía:
                    </span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {result.calcResult.guaranteeCoverage ?? "Sin garantía"}
                    </strong>
                  </li>
                  <li className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Periodos de amortización:
                    </span>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {result.calcResult.amortizationSchedule.length} periodos
                    </strong>
                  </li>
                </ul>

                {result.hardRuleHits.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-2 pt-3 border-t border-[var(--border-default)]">
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--warning)" }}
                    >
                      Alertas de Políticas
                    </span>
                    <ul className="flex flex-col gap-2">
                      {result.hardRuleHits.map((hit) => (
                        <li
                          key={hit.ruleCode}
                          className="p-2.5 rounded text-xs leading-relaxed"
                          style={{
                            background: "var(--warning-bg)",
                            color: "var(--warning)",
                            border: "1px solid var(--warning)",
                          }}
                        >
                          [{hit.severity}] {hit.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div
                    className="p-3 rounded text-xs"
                    style={{
                      background: "var(--success-bg)",
                      color: "var(--success)",
                    }}
                  >
                    Cumple con los parámetros institucionales establecidos.
                  </div>
                )}
              </div>
            ) : (
              <div
                className="cr-card cr-card--flat p-6 flex flex-col items-center justify-center text-center gap-2"
                style={{ minHeight: "240px" }}
              >
                <IconCoins size={36} className="opacity-40" />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Ingrese los parámetros y presione &quot;Calcular&quot; para estimar las condiciones financieras.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CreceAppShell>
  );
}





