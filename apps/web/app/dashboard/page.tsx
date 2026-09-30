"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreceAppShell,
  CrecePageHeader,
  CreceCard,
  CreceButton,
  CreceBadge,
  CreceAlert,
} from "../../components/crece-ui";
import { IconUsers, IconFilePlus, IconCoins } from "../../components/icons";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Policy = {
  thresholdGTQ: number;
  quorumN: number;
  officeLabels: Record<string, string>;
  outcomes: string[];
};

export default function DashboardPage() {
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
    <CreceAppShell
      activeItem="dashboard"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Panel operativo" },
      ]}
    >
      <CrecePageHeader
        overline="Gobernanza y Políticas"
        title="Panel Operativo"
        description="Parámetros de autorización y accesos directos a los flujos de gestión de expedientes."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/persons">
              <CreceButton variant="secondary" icon={IconUsers}>
                Solicitantes
              </CreceButton>
            </Link>
            <Link href="/operations/new">
              <CreceButton variant="accent" icon={IconFilePlus}>
                + Nueva Solicitud
              </CreceButton>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreceCard title="Política de Autorización y Umbrales">
          <div className="flex flex-col gap-3 text-sm mt-1">
            <div className="flex justify-between py-2 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">Umbral de Consejo:</span>
              <strong className="font-mono text-base" style={{ color: "var(--brand)" }}>
                Q{policy?.thresholdGTQ ? policy.thresholdGTQ.toLocaleString("es-GT") : "50,000.00"}
              </strong>
            </div>

            <div className="flex justify-between py-2 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">Quórum requerido:</span>
              <span className="font-medium">
                {policy?.quorumN ?? 2} votos de miembros del Consejo
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">Cargos autorizados:</span>
              <span className="text-xs text-right max-w-xs text-[var(--text-body)]">
                {policy ? Object.values(policy.officeLabels).join(" · ") : "Jefe de Agencia · Delegado · Consejo"}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-[var(--text-secondary)]">Resoluciones posibles:</span>
              <div className="flex flex-wrap gap-1 justify-end">
                <CreceBadge tone="success" pill>Aprobar</CreceBadge>
                <CreceBadge tone="info" pill>Con Cambios</CreceBadge>
                <CreceBadge tone="warning" pill>Devolver</CreceBadge>
                <CreceBadge tone="danger" pill>Rechazar</CreceBadge>
              </div>
            </div>
          </div>
        </CreceCard>

        <CreceCard title="Módulos Operativos">
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-lg border bg-[var(--bg-subtle)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <strong className="text-sm">Directorio de Solicitantes</strong>
                <CreceBadge tone="success">Activo</CreceBadge>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Padrón de asociados y prospectos bajo perfil institucional único y trazabilidad de origen.
              </p>
              <div className="flex gap-2 mt-1">
                <Link href="/persons">
                  <CreceButton variant="primary" size="sm">
                    Ir a Solicitantes
                  </CreceButton>
                </Link>
                <Link href="/persons/new">
                  <CreceButton variant="secondary" size="sm">
                    + Registrar
                  </CreceButton>
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-[var(--bg-subtle)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <strong className="text-sm">Apertura de Solicitudes</strong>
                <CreceBadge tone="accent">Activo</CreceBadge>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Apertura con resolución automática de requisitos según producto, tipo de garantía y fiador.
              </p>
              <div className="flex gap-2 mt-1">
                <Link href="/operations/new">
                  <CreceButton variant="accent" size="sm">
                    Aperturar Solicitud
                  </CreceButton>
                </Link>
                <Link href="/calc">
                  <CreceButton variant="secondary" size="sm">
                    Simulador
                  </CreceButton>
                </Link>
              </div>
            </div>
          </div>
        </CreceCard>
      </div>
    </CreceAppShell>
  );
}
