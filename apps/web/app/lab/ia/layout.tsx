import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLabEnabled } from "../../../lib/lab-flags";
import { LabShell } from "./lab-shell";

export const metadata: Metadata = {
  title: "Laboratorio de IA — CRECE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Guarda del servidor: fuera de desarrollo o sin flag, el laboratorio no existe (404). */
export default function LabLayout({ children }: { children: React.ReactNode }) {
  if (!isLabEnabled()) notFound();
  return (
    <>
      <link rel="stylesheet" href="/lab/ia/ds/tokens.css" precedence="default" />
      <link rel="stylesheet" href="/lab/ia/ds/components.css" precedence="default" />
      <div className="cr-root" style={{ minHeight: "100vh", background: "var(--bg-canvas)", color: "var(--text-body)" }}>
        <LabShell>{children}</LabShell>
      </div>
    </>
  );
}
