"use client";

import { usePathname, useRouter } from "next/navigation";
import { CreceProvider, useCrece } from "../../../lib/crece-ds";

const SECTIONS: Array<[string, string]> = [
  ["extraccion", "Extracción"],
  ["ejecuciones", "Ejecuciones"],
];

function Shell({ children }: { children: React.ReactNode }) {
  const { PageHeader, Tabs, Alert } = useCrece();
  const pathname = usePathname();
  const router = useRouter();
  const active = SECTIONS.find(([slug]) => pathname.startsWith(`/lab/ia/${slug}`))?.[0] ?? "extraccion";

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "var(--space-8) var(--space-6)", display: "grid", gap: "var(--space-6)" }}>
      <PageHeader
        overline="Solo desarrollo"
        title="Laboratorio de IA"
        description="Prueba cada etapa del motor con archivos de prueba antes de conectarlo al flujo de crédito. Usa exactamente el mismo código que producción."
      />
      <Alert tone="warning" title="Solo documentos sintéticos o anonimizados">
        Lo que subas aquí se envía a los proveedores de IA (Mistral y Google). No uses expedientes reales ni datos personales de
        asociados. Los archivos se borran automáticamente.
      </Alert>
      <Tabs tabs={SECTIONS} value={active} onChange={(slug: string) => router.push(`/lab/ia/${slug}`)} />
      <section>{children}</section>
    </main>
  );
}

export function LabShell({ children }: { children: React.ReactNode }) {
  return (
    <CreceProvider>
      <Shell>{children}</Shell>
    </CreceProvider>
  );
}
