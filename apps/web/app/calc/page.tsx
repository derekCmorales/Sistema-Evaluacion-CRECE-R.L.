"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body = {
      amount: Number(form.get("amount")),
      termMonths: Number(form.get("termMonths")),
      annualRatePercent: Number(form.get("annualRatePercent")),
      purpose: String(form.get("purpose") ?? ""),
      assessment: {
        monthlySales: Number(form.get("monthlySales")),
        monthlyIncome: Number(form.get("monthlyIncome")),
        monthlyExpenses: Number(form.get("monthlyExpenses")),
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
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8">
      <Link href="/" className="text-[#034381] text-sm hover:underline">
        ← Inicio
      </Link>
      <h1 className="text-2xl font-semibold mt-6 mb-2">Motor de cálculo</h1>
      <p className="text-zinc-600 max-w-xl mb-6 text-sm">
        Caso ilustrativo Don Marco (Q40,000). Los números llevan etiqueta
        calculada: no hay puntaje ni “recomendado aprobar”.
      </p>
      <form onSubmit={onSubmit} className="grid gap-3 max-w-md text-sm">
        <label>
          Monto GTQ
          <input
            name="amount"
            defaultValue={40000}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Plazo (meses)
          <input
            name="termMonths"
            defaultValue={24}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Tasa anual %
          <input
            name="annualRatePercent"
            defaultValue={18}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Ingreso mensual
          <input
            name="monthlyIncome"
            defaultValue={18000}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Ventas mensuales
          <input
            name="monthlySales"
            defaultValue={45000}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Gastos mensuales
          <input
            name="monthlyExpenses"
            defaultValue={9000}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Deuda existente (cuota)
          <input
            name="existingDebtPayment"
            defaultValue={1500}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Valor garantía
          <input
            name="guaranteeValue"
            defaultValue={80000}
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Destino
          <input
            name="purpose"
            defaultValue="Capital de trabajo ferretería"
            className="mt-1 w-full border rounded px-2 py-1"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="bg-[#034381] text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Calculando…" : "Calcular"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {result ? (
        <section className="mt-8 max-w-lg bg-white border rounded-lg p-5 text-sm">
          <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
            Calculado por el sistema
          </p>
          <ul className="grid gap-1">
            <li>Cuota: Q{result.calcResult.installment.amount}</li>
            <li>Capacidad: Q{result.calcResult.paymentCapacity.amount}</li>
            <li>
              Ratio cuota/ingreso:{" "}
              {(result.calcResult.installmentToIncomeRatio * 100).toFixed(1)}%
            </li>
            <li>
              Cobertura:{" "}
              {result.calcResult.guaranteeCoverage ?? "sin garantía"}
            </li>
            <li>
              Amortización: {result.calcResult.amortizationSchedule.length}{" "}
              periodos
            </li>
          </ul>
          {result.hardRuleHits.length > 0 ? (
            <ul className="mt-4 grid gap-2">
              {result.hardRuleHits.map((hit) => (
                <li key={hit.ruleCode} className="text-amber-800">
                  [{hit.severity}] {hit.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-zinc-500">Sin reglas duras disparadas.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
