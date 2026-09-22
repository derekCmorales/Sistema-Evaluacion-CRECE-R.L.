"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Policy = {
  thresholdGTQ: number;
  quorumN: number;
  officeLabels: Record<string, string>;
  outcomes: string[];
};

export default function DashboardPlaceholder() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${api}/approvals/policy`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Policy>;
      })
      .then(setPolicy)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8">
      <Link href="/" className="text-[#034381] text-sm hover:underline">
        ← Inicio
      </Link>
      <h1 className="text-2xl font-semibold mt-6 mb-2">Panel operativo</h1>
      <p className="text-zinc-600 max-w-xl mb-6">
        Placeholder autenticado. La política de autorización ya sale del
        dominio; RBAC HTTP y persistencia Prisma vienen en changes posteriores.
      </p>
      {error ? (
        <p className="text-sm text-red-700">
          No se pudo leer la API ({error}). ¿Está `pnpm dev:api` en {api}?
        </p>
      ) : null}
      {policy ? (
        <dl className="grid gap-3 max-w-lg text-sm bg-white border rounded-lg p-5">
          <div>
            <dt className="text-zinc-500">Umbral Consejo (semilla)</dt>
            <dd className="font-medium">Q{policy.thresholdGTQ.toLocaleString("es-GT")}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Quórum N de M (semilla)</dt>
            <dd className="font-medium">{policy.quorumN} votos de miembros del Consejo</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Cargos</dt>
            <dd>{Object.values(policy.officeLabels).join(" · ")}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Outcomes</dt>
            <dd>{policy.outcomes.join(" · ")}</dd>
          </div>
        </dl>
      ) : null}
      <p className="mt-6">
        <Link href="/calc" className="text-[#e8973c] hover:underline text-sm">
          Probar motor de cálculo →
        </Link>
      </p>
    </div>
  );
}
