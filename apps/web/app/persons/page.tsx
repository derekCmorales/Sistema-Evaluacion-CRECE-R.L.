"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreceAppShell,
  CrecePageHeader,
  CreceCard,
  CreceButton,
  CreceBadge,
  CreceTextField,
  CreceStat,
} from "../../components/crece-ui";
import {
  IconUsers,
  IconUser,
  IconUserPlus,
  IconFilePlus,
  IconMagnifyingGlass,
  IconCoins,
  IconBuildings,
  IconGlobe,
  IconPhone,
  IconEnvelope,
} from "../../components/icons";
import {
  MOCK_PERSON_ACTIVE,
  MOCK_PERSON_PROSPECT,
} from "@crece/domain";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type PersonItem = {
  id: string;
  fullName: string;
  dpi?: string;
  contacts?: {
    phone: string;
    email?: string;
  };
  phone?: string;
  email?: string;
  status: string;
  source?: "LANDING" | "ADVISOR";
  interest?: "CREDIT" | "SAVINGS" | "FIXED_TERM";
  registeredByUserId?: string;
  createdAt: string;
  operationsCount?: number;
};

export default function PersonsListPage() {
  const [persons, setPersons] = useState<PersonItem[]>([]);
  const [search, setSearch] = useState("");
  const [interestFilter, setInterestFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function loadPersons() {
      try {
        const res = await fetch(`${API_BASE}/persons`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPersons(data.items ?? []);
      } catch {
        // Fallback local enriquecido con fixtures
        setUsingFallback(true);
        setPersons([
          {
            ...MOCK_PERSON_PROSPECT,
            source: (MOCK_PERSON_PROSPECT.source ?? "LANDING") as "LANDING" | "ADVISOR",
            phone: MOCK_PERSON_PROSPECT.contacts.phone,
            email: MOCK_PERSON_PROSPECT.contacts.email,
            operationsCount: 1,
          },
          {
            ...MOCK_PERSON_ACTIVE,
            source: (MOCK_PERSON_ACTIVE.source ?? "ADVISOR") as "LANDING" | "ADVISOR",
            phone: MOCK_PERSON_ACTIVE.contacts.phone,
            email: MOCK_PERSON_ACTIVE.contacts.email,
            operationsCount: 1,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadPersons();
  }, []);

  const formatDpi = (val?: string) => {
    if (!val) return "Sin DPI";
    const clean = val.replace(/\D/g, "");
    if (clean.length === 13) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 9)} ${clean.slice(9, 13)}`;
    }
    return val;
  };

  const filteredPersons = persons.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      p.fullName.toLowerCase().includes(q) ||
      (p.dpi ?? "").includes(q) ||
      (p.phone ?? p.contacts?.phone ?? "").includes(q);

    const matchesInterest =
      interestFilter === "ALL" || p.interest === interestFilter;

    const matchesSource =
      sourceFilter === "ALL" || p.source === sourceFilter;

    return matchesSearch && matchesInterest && matchesSource;
  });

  const totalPersons = persons.length;
  const prospectCount = persons.filter((p) => p.source === "LANDING").length;
  const advisorCount = persons.filter((p) => p.source === "ADVISOR").length;
  const totalOperations = persons.reduce((acc, p) => acc + (p.operationsCount ?? 0), 0);

  return (
    <CreceAppShell
      activeItem="persons"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Solicitantes" },
      ]}
    >
      <CrecePageHeader
        overline="Gestión de Solicitantes"
        title="Directorio de Solicitantes"
        description="Padrón centralizado de asociados y prospectos. Cada persona cuenta con un perfil único para todos sus trámites y expedientes."
        actions={
          <Link href="/persons/new">
            <CreceButton variant="accent" icon={IconUserPlus}>
              Registrar solicitante
            </CreceButton>
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CreceCard variant="flat">
          <CreceStat
            label={
              <span className="flex items-center gap-1.5 font-medium">
                <IconUsers size={16} /> Total perfiles únicos
              </span>
            }
            value={totalPersons}
            help="Deduplicados por DPI"
          />
        </CreceCard>
        <CreceCard variant="flat">
          <CreceStat
            label={
              <span className="flex items-center gap-1.5 font-medium">
                <IconGlobe size={16} /> Canal digital
              </span>
            }
            value={prospectCount}
            help="Estado inicial: Prospecto"
          />
        </CreceCard>
        <CreceCard variant="flat">
          <CreceStat
            label={
              <span className="flex items-center gap-1.5 font-medium">
                <IconUserPlus size={16} /> Registro en agencia
              </span>
            }
            value={advisorCount}
            help="Registrados con auditoría"
          />
        </CreceCard>
        <CreceCard variant="flat">
          <CreceStat
            label={
              <span className="flex items-center gap-1.5 font-medium">
                <IconCoins size={16} /> Expedientes vinculados
              </span>
            }
            value={totalOperations}
            help="Solicitudes creadas"
          />
        </CreceCard>
      </div>

      {/* Search & Filters */}
      <CreceCard>
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <CreceTextField
              placeholder="Buscar por DPI (13 dígitos), nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<IconMagnifyingGlass size={16} className="text-[var(--text-secondary)]" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1">
              Producto:
            </span>
            {[
              { id: "ALL", label: "Todos" },
              { id: "CREDIT", label: "Crédito" },
              { id: "SAVINGS", label: "Ahorro" },
              { id: "FIXED_TERM", label: "Plazo Fijo" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setInterestFilter(f.id)}
                className={`cr-chip ${interestFilter === f.id ? "cr-chip--selected" : ""}`}
              >
                {f.label}
              </button>
            ))}

            <span className="text-xs font-semibold text-[var(--text-secondary)] ml-3 mr-1">
              Origen:
            </span>
            {[
              { id: "ALL", label: "Todos" },
              { id: "LANDING", label: "Landing" },
              { id: "ADVISOR", label: "Asesor" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSourceFilter(f.id)}
                className={`cr-chip ${sourceFilter === f.id ? "cr-chip--selected" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table of persons */}
        <div className="cr-table-wrap mt-5">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>DPI Único</th>
                <th>Contacto</th>
                <th>Interés</th>
                <th>Origen y Auditoría</th>
                <th className="cr-num-cell">Expedientes</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-[var(--text-secondary)]">
                    Cargando solicitantes registrados...
                  </td>
                </tr>
              ) : filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <IconUsers size={36} className="text-[var(--text-secondary)] opacity-50" />
                      <strong className="text-base font-bold text-[var(--text-primary)]">
                        No se encontraron solicitantes
                      </strong>
                      <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                        No hay registros que coincidan con los filtros aplicados.
                      </p>
                      <Link href="/persons/new" className="mt-2">
                        <CreceButton variant="primary" size="sm" icon={IconUserPlus}>
                          Registrar primer solicitante
                        </CreceButton>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPersons.map((p) => {
                  const phone = p.phone ?? p.contacts?.phone ?? "No registrado";
                  const email = p.email ?? p.contacts?.email;
                  const opCount = p.operationsCount ?? 0;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="cr-avatar cr-avatar--sm">
                            {p.fullName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/persons/${p.id}`}
                              className="font-bold text-sm hover:underline"
                              style={{ color: "var(--brand)" }}
                            >
                              {p.fullName}
                            </Link>
                            <small className="block text-[11px] text-[var(--text-secondary)]">
                              ID: {p.id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                          {formatDpi(p.dpi)}
                        </span>
                      </td>
                      <td>
                        <div className="text-xs flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                            <IconPhone size={12} className="text-[var(--text-secondary)]" /> {phone}
                          </span>
                          {email && (
                            <span className="flex items-center gap-1.5 text-[var(--text-secondary)] truncate max-w-[180px]">
                              <IconEnvelope size={12} /> {email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {p.interest === "CREDIT" && (
                          <CreceBadge tone="info" pill>
                            Crédito
                          </CreceBadge>
                        )}
                        {p.interest === "SAVINGS" && (
                          <CreceBadge tone="success" pill>
                            Ahorro
                          </CreceBadge>
                        )}
                        {p.interest === "FIXED_TERM" && (
                          <CreceBadge tone="accent" pill>
                            Plazo Fijo
                          </CreceBadge>
                        )}
                        {!p.interest && (
                          <CreceBadge tone="neutral" pill>
                            General
                          </CreceBadge>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 text-xs">
                          {p.source === "LANDING" ? (
                            <CreceBadge tone="neutral">
                              <span className="flex items-center gap-1">
                                <IconGlobe size={11} /> Portal Web
                              </span>
                            </CreceBadge>
                          ) : (
                            <CreceBadge tone="solid">
                              <span className="flex items-center gap-1">
                                <IconUser size={11} /> Agencia
                              </span>
                            </CreceBadge>
                          )}
                          {p.registeredByUserId && (
                            <small className="text-[11px] text-[var(--text-secondary)]">
                              Por: {p.registeredByUserId}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="cr-num-cell">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            opCount > 0
                              ? "bg-[var(--info-bg)] text-[var(--info)]"
                              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {opCount} {opCount === 1 ? "expediente" : "expedientes"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="inline-flex items-center gap-2">
                          <Link href={`/persons/${p.id}`}>
                            <CreceButton variant="secondary" size="sm">
                              Ver perfil
                            </CreceButton>
                          </Link>
                          <Link href={`/operations/new?personId=${p.id}`}>
                            <CreceButton variant="primary" size="sm" icon={IconFilePlus}>
                              + Solicitud
                            </CreceButton>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CreceCard>
    </CreceAppShell>
  );
}
