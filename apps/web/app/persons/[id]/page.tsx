"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CreceAppShell,
  CrecePageHeader,
  CreceCard,
  CreceButton,
  CreceBadge,
  CreceStat,
} from "../../../components/crece-ui";
import {
  IconUser,
  IconFilePlus,
  IconArrowLeft,
  IconCoins,
  IconFileText,
  IconShieldCheck,
  IconCheck,
  IconGlobe,
  IconFolder,
  IconWarningCircle,
} from "../../../components/icons";
import {
  MOCK_PERSON_ACTIVE,
  MOCK_PERSON_PROSPECT,
  MOCK_DRAFT_OPERATION_NO_GUARANTOR,
  MOCK_DRAFT_OPERATION_WITH_GUARANTOR,
} from "@crece/domain";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type OperationItem = {
  id: string;
  productType: "WORKING_CAPITAL" | "INVESTMENT" | "MICROCREDIT";
  guaranteeType: "MORTGAGE" | "PLEDGE" | "PERSONAL" | "MIXED";
  requestedAmount: { amount: string; currency: string };
  termMonths: number;
  purpose: string;
  hasGuarantor: boolean;
  state: string;
  checklist?: Array<{ code: string; label: string; status: string; required: boolean }>;
  createdAt: string;
  createdBy?: string;
};

type PersonDetails = {
  id: string;
  fullName: string;
  dpi?: string;
  contacts?: { phone: string; email?: string };
  phone?: string;
  email?: string;
  status: string;
  source?: "LANDING" | "ADVISOR";
  interest?: string;
  registeredByUserId?: string;
  createdAt: string;
  operations?: OperationItem[];
  operationsCount?: number;
};

export default function PersonProfilePage() {
  const params = useParams();
  const personId = params.id as string;

  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPersonData() {
      try {
        const res = await fetch(`${API_BASE}/persons/${personId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPerson(data);

        // Cargar operaciones vinculadas
        if (data.operations && Array.isArray(data.operations)) {
          setOperations(data.operations);
        } else {
          const opsRes = await fetch(`${API_BASE}/operations?personId=${personId}`);
          if (opsRes.ok) {
            const opsData = await opsRes.json();
            setOperations(opsData.items ?? []);
          }
        }
      } catch {
        // Fallback a fixture si es un mock o backend no responde
        let mock =
          personId === "mock-person-002" ? MOCK_PERSON_ACTIVE : MOCK_PERSON_PROSPECT;
        let mockOps =
          personId === "mock-person-002"
            ? [MOCK_DRAFT_OPERATION_WITH_GUARANTOR]
            : [MOCK_DRAFT_OPERATION_NO_GUARANTOR];

        setPerson({
          ...mock,
          source: (mock.source ?? "ADVISOR") as "LANDING" | "ADVISOR",
          phone: mock.contacts.phone,
          email: mock.contacts.email,
          operations: mockOps as any,
          operationsCount: mockOps.length,
        });
        setOperations(mockOps as any);
      } finally {
        setLoading(false);
      }
    }

    if (personId) {
      loadPersonData();
    }
  }, [personId]);

  if (loading) {
    return (
      <CreceAppShell activeItem="persons">
        <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
          Cargando expediente del solicitante...
        </div>
      </CreceAppShell>
    );
  }

  if (!person) {
    return (
      <CreceAppShell activeItem="persons">
        <CreceCard className="text-center py-12">
          <h2 className="text-lg font-bold">Persona no encontrada</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            No se localizó un perfil único con identificador {personId}.
          </p>
          <Link href="/persons" className="mt-4 inline-block">
            <CreceButton variant="primary">Volver a solicitantes</CreceButton>
          </Link>
        </CreceCard>
      </CreceAppShell>
    );
  }

  const formatDpi = (val?: string) => {
    if (!val) return "Sin DPI";
    const clean = val.replace(/\D/g, "");
    if (clean.length === 13) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 9)} ${clean.slice(9, 13)}`;
    }
    return val;
  };

  const productLabels: Record<string, string> = {
    WORKING_CAPITAL: "Capital de Trabajo",
    INVESTMENT: "Inversión y Maquinaria",
    MICROCREDIT: "Microcrédito Productivo",
  };

  const guaranteeLabels: Record<string, string> = {
    MORTGAGE: "Hipotecaria",
    PLEDGE: "Prendaria",
    PERSONAL: "Fiduciaria / Personal",
    MIXED: "Mixta",
  };

  const stateLabels: Record<string, { label: string; tone: "info" | "success" | "warning" | "neutral" }> = {
    DRAFT: { label: "Borrador (DRAFT)", tone: "neutral" },
    READY_FOR_REVIEW: { label: "Listo para revisión", tone: "info" },
    UNDER_REVIEW: { label: "En evaluación", tone: "warning" },
    APPROVED: { label: "Aprobada", tone: "success" },
  };

  return (
    <CreceAppShell
      activeItem="persons"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Solicitantes", href: "/persons" },
        { label: person.fullName },
      ]}
    >
      <CrecePageHeader
        overline="Perfil de Solicitante"
        title={person.fullName}
        description={`DPI: ${formatDpi(person.dpi)} · ID Único: ${person.id} · Registrado el ${new Date(person.createdAt).toLocaleDateString("es-GT")}`}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/persons">
              <CreceButton variant="secondary" icon={IconArrowLeft}>
                Volver
              </CreceButton>
            </Link>
            <Link href={`/operations/new?personId=${person.id}`}>
              <CreceButton variant="accent" icon={IconFilePlus}>
                + Aperturar nueva solicitud de crédito
              </CreceButton>
            </Link>
          </div>
        }
      />

      {/* Grid: Profile summary & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <CreceCard title="Datos Generales del Solicitante">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">DPI Nacional:</span>
              <strong className="font-mono">{formatDpi(person.dpi)}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">Teléfono:</span>
              <strong className="font-mono">{person.phone ?? person.contacts?.phone ?? "No registrado"}</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">Correo electrónico:</span>
              <span>{person.email ?? person.contacts?.email ?? "No registrado"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">Estado de socio:</span>
              <CreceBadge tone={person.status === "ACTIVE" ? "success" : "neutral"} pill>
                {person.status === "ACTIVE" ? "Asociado Activo" : "Prospecto"}
              </CreceBadge>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border-default)]">
              <span className="text-[var(--text-secondary)]">Canal de origen:</span>
              <span className="flex items-center gap-1.5">
                {person.source === "LANDING" ? (
                  <>
                    <IconGlobe size={13} className="text-[var(--text-secondary)]" /> Formulario Web
                  </>
                ) : (
                  <>
                    <IconUser size={13} className="text-[var(--text-secondary)]" /> Asesor / Agencia
                  </>
                )}
              </span>
            </div>
            {person.registeredByUserId && (
              <div className="flex justify-between py-1.5">
                <span className="text-[var(--text-secondary)]">Registrado por:</span>
                <span className="font-medium text-xs">{person.registeredByUserId}</span>
              </div>
            )}
          </div>
        </CreceCard>

        {/* Deduplication Guarantee Note */}
        <CreceCard title="Perfil Único Institucional">
          <div className="flex flex-col gap-3 text-xs leading-relaxed text-[var(--text-body)]">
            <div
              className="p-3 rounded-lg border text-xs"
              style={{
                background: "var(--info-bg)",
                borderColor: "var(--info)",
                color: "var(--brand)",
              }}
            >
              <strong>Perfil consolidado:</strong> Toda solicitud de crédito, cuenta de ahorro o certificado de plazo fijo se asocia exclusivamente a este perfil (<code>{person.id}</code>).
            </div>

            <p className="text-[var(--text-secondary)]">
              Tanto el canal digital como los asesores verifican el DPI contra el registro central antes de admitir cualquier trámite nuevo.
            </p>
          </div>
        </CreceCard>

        {/* Expedientes Summary Stat */}
        <CreceCard title="Historial y Expedientes">
          <div className="flex flex-col gap-4">
            <CreceStat
              label="Expedientes aperturados"
              value={operations.length}
              help="Consolidados bajo este perfil"
            />
            <Link href={`/operations/new?personId=${person.id}`} className="mt-2">
              <CreceButton variant="primary" block icon={IconFilePlus}>
                Crear nueva solicitud
              </CreceButton>
            </Link>
          </div>
        </CreceCard>
      </div>

      {/* Expedientes Previos de la Persona */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Expedientes y Solicitudes Vinculadas
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Historial de créditos y trámites de esta persona. Revise los requisitos pendientes o continúe la gestión.
            </p>
          </div>
        </div>

        {operations.length === 0 ? (
          <CreceCard className="text-center py-10">
            <div className="flex flex-col items-center gap-3">
              <IconFolder size={36} className="text-[var(--text-secondary)] opacity-50" />
              <strong className="text-base font-bold text-[var(--text-primary)]">
                No hay expedientes aperturados para este perfil
              </strong>
              <p className="text-xs text-[var(--text-secondary)] max-w-md">
                Esta persona aún no cuenta con solicitudes de crédito en el sistema. Puedes aperturar la primera solicitud en borrador.
              </p>
              <Link href={`/operations/new?personId=${person.id}`} className="mt-2">
                <CreceButton variant="accent" icon={IconFilePlus}>
                  Aperturar primera solicitud de crédito
                </CreceButton>
              </Link>
            </div>
          </CreceCard>
        ) : (
          <div className="flex flex-col gap-4">
            {operations.map((op) => {
              const amountNum = parseFloat(op.requestedAmount.amount) || 0;
              const formattedAmount = `Q${amountNum.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`;
              const stateInfo = stateLabels[op.state] ?? { label: op.state, tone: "neutral" };
              const pendingDocs = op.checklist?.filter((c) => c.status === "PENDING" && c.required).length ?? 0;
              const totalDocs = op.checklist?.length ?? 0;

              return (
                <CreceCard key={op.id} variant="elevated">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ background: "var(--bg-muted)", color: "var(--brand)" }}
                      >
                        <IconFileText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-base" style={{ color: "var(--text-primary)" }}>
                            {productLabels[op.productType] ?? op.productType}
                          </strong>
                          <CreceBadge tone={stateInfo.tone} pill>
                            {stateInfo.label}
                          </CreceBadge>
                          {op.hasGuarantor && (
                            <CreceBadge tone="info">Con Fiador</CreceBadge>
                          )}
                        </div>
                        <small className="text-xs text-[var(--text-secondary)]">
                          Operación ID: <span className="font-mono">{op.id}</span> · Aperturado el {new Date(op.createdAt).toLocaleDateString("es-GT")}
                        </small>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black font-mono" style={{ color: "var(--brand)" }}>
                        {formattedAmount}
                      </div>
                      <small className="text-xs text-[var(--text-secondary)]">
                        Plazo: {op.termMonths} meses · Garantía {guaranteeLabels[op.guaranteeType] ?? op.guaranteeType}
                      </small>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                    <div>
                      <span className="text-[var(--text-secondary)] block mb-1">Destino del crédito:</span>
                      <p className="font-medium text-[var(--text-primary)]">{op.purpose}</p>
                    </div>

                    <div>
                      <span className="text-[var(--text-secondary)] block mb-1">Estado de requisitos:</span>
                      <span className="font-semibold text-sm">
                        {totalDocs > 0 ? (
                          <>
                            {totalDocs - pendingDocs} de {totalDocs} completados
                            {pendingDocs > 0 && (
                              <span className="text-[var(--warning)] flex items-center gap-1 mt-0.5 font-normal">
                                <IconWarningCircle size={13} /> {pendingDocs} pendientes de adjuntar
                              </span>
                            )}
                          </>
                        ) : (
                          "Requisitos generados"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link href={`/operations/${op.id}`}>
                        <CreceButton variant="primary" size="sm" icon={IconFileText}>
                          Ver expediente completo
                        </CreceButton>
                      </Link>
                    </div>
                  </div>
                </CreceCard>
              );
            })}
          </div>
        )}
      </div>
    </CreceAppShell>
  );
}
