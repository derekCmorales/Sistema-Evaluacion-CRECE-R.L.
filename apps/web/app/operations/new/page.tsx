"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreceAppShell,
  CrecePageHeader,
  CreceCard,
  CreceButton,
  CreceBadge,
  CreceAlert,
  CreceTextField,
  CreceSelect,
  CreceCurrencyField,
  CreceSwitch,
} from "../../../components/crece-ui";
import {
  IconFilePlus,
  IconCheck,
  IconCheckCircle,
  IconArrowLeft,
  IconCoins,
  IconShieldCheck,
  IconUsers,
  IconFileText,
  IconBriefcase,
  IconGear,
  IconPlant,
  IconInfo,
} from "../../../components/icons";
import {
  createChecklistItems,
  MOCK_PERSON_ACTIVE,
  MOCK_PERSON_PROSPECT,
} from "@crece/domain";
import type { ProductType, GuaranteeType } from "@crece/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const GUARANTEE_OPTIONS: Array<{ value: GuaranteeType; label: string }> = [
  { value: "MORTGAGE", label: "Hipotecaria (Bienes Inmuebles, Terrenos, Casas)" },
  { value: "PLEDGE", label: "Prendaria (Maquinaria, Vehículos, Mercadería)" },
  { value: "PERSONAL", label: "Fiduciaria / Personal (Sin gravamen específico)" },
  { value: "MIXED", label: "Mixta (Hipotecaria + Prendaria o Fiduciaria)" },
];

const TERM_OPTIONS = [
  { value: "12", label: "12 meses (1 año)" },
  { value: "18", label: "18 meses (1.5 años)" },
  { value: "24", label: "24 meses (2 años)" },
  { value: "36", label: "36 meses (3 años)" },
  { value: "48", label: "48 meses (4 años)" },
  { value: "60", label: "60 meses (5 años)" },
];

function NewOperationForm() {
  const searchParams = useSearchParams();
  const initialPersonId = searchParams.get("personId") ?? "";

  const [availablePersons, setAvailablePersons] = useState<
    Array<{ id: string; fullName: string; dpi?: string }>
  >([]);
  const [selectedPersonId, setSelectedPersonId] = useState(initialPersonId);
  const [productType, setProductType] = useState<ProductType>("WORKING_CAPITAL");
  const [guaranteeType, setGuaranteeType] = useState<GuaranteeType>("PERSONAL");
  const [amount, setAmount] = useState<number>(35000);
  const [termMonths, setTermMonths] = useState<number>(24);
  const [purpose, setPurpose] = useState<string>("");
  const [hasGuarantor, setHasGuarantor] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdOperation, setCreatedOperation] = useState<{
    operationId: string;
    personId: string;
    state: string;
    checklistCount: number;
  } | null>(null);

  // Cargar personas registradas para selección
  useEffect(() => {
    async function fetchPersons() {
      try {
        const res = await fetch(`${API_BASE}/persons`);
        if (res.ok) {
          const data = await res.json();
          const items = (data.items ?? []).map((p: any) => ({
            id: p.id,
            fullName: p.fullName,
            dpi: p.dpi,
          }));
          setAvailablePersons(items);
          if (!selectedPersonId && items.length > 0) {
            setSelectedPersonId(items[0].id);
          }
        }
      } catch {
        // Fallback a fixtures locales
        const mockPersons = [
          { id: MOCK_PERSON_PROSPECT.id, fullName: MOCK_PERSON_PROSPECT.fullName, dpi: MOCK_PERSON_PROSPECT.dpi },
          { id: MOCK_PERSON_ACTIVE.id, fullName: MOCK_PERSON_ACTIVE.fullName, dpi: MOCK_PERSON_ACTIVE.dpi },
        ];
        setAvailablePersons(mockPersons);
        if (!selectedPersonId && mockPersons.length > 0) {
          setSelectedPersonId(mockPersons[0].id);
        }
      }
    }

    fetchPersons();
  }, [selectedPersonId]);

  // Resolución dinámica en tiempo real del checklist (Fase 2 de instrucciones.txt)
  // "La lista de requisitos se genera según producto, garantía y si hay fiador. No es una lista fija, es lo que queda pendiente"
  const dynamicChecklist = useMemo(() => {
    return createChecklistItems({
      productType,
      guaranteeType,
      hasGuarantor,
    });
  }, [productType, guaranteeType, hasGuarantor]);

  const selectedPerson = availablePersons.find((p) => p.id === selectedPersonId);

  // Validación completa de campos
  const validateAllFields = () => {
    const errors: Record<string, string> = {};

    if (!selectedPersonId) {
      errors.selectedPersonId = "Debe seleccionar un solicitante titular registrado";
    }

    if (!amount || amount <= 0) {
      errors.amount = "Debe ingresar un monto solicitado mayor a cero";
    } else if (amount < 1000) {
      errors.amount = "El monto mínimo para apertura de crédito es de Q1,000.00";
    } else if (amount > 150000) {
      errors.amount = "El monto máximo institucional para solicitudes ordinarias es de Q150,000.00";
    }

    if (!termMonths || termMonths < 6 || termMonths > 60) {
      errors.termMonths = "Seleccione un plazo válido para la operación (entre 6 y 60 meses)";
    }

    const cleanPurpose = purpose.trim();
    if (!cleanPurpose) {
      errors.purpose = "El destino del crédito es obligatorio para conformar el expediente";
    } else if (cleanPurpose.length < 5) {
      errors.purpose = "Especifique el destino con mayor detalle (mínimo 5 caracteres)";
    }

    return errors;
  };

  const handlePersonChange = (val: string) => {
    setSelectedPersonId(val);
    if (fieldErrors.selectedPersonId) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.selectedPersonId;
        return next;
      });
    }
  };

  const handleAmountChange = (val: number) => {
    setAmount(val);
    if (fieldErrors.amount) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.amount;
        return next;
      });
    }
  };

  const handleTermMonthsChange = (val: number) => {
    setTermMonths(val);
    if (fieldErrors.termMonths) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.termMonths;
        return next;
      });
    }
  };

  const handlePurposeChange = (val: string) => {
    setPurpose(val);
    if (fieldErrors.purpose) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.purpose;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validateAllFields();
    setFieldErrors(validationErrors);

    const errorCount = Object.keys(validationErrors).length;
    if (errorCount > 0) {
      setFormError(
        errorCount === 1
          ? "Se encontró 1 campo con datos pendientes. Verifique la indicación sobre el campo resaltado."
          : `Se encontraron ${errorCount} campos con errores. Por favor verifique las indicaciones resaltadas sobre cada campo.`
      );

      const firstKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(firstKey) || document.querySelector(`[name="${firstKey}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement)?.focus();
      return;
    }


    setSubmitting(true);

    const payload = {
      personId: selectedPersonId,
      productType,
      guaranteeType,
      requestedAmount: amount,
      termMonths,
      purpose: purpose.trim(),
      hasGuarantor,
      createdBy: "user-mario-branch-head",
    };

    try {
      const res = await fetch(`${API_BASE}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? `Error HTTP ${res.status}`);
      }

      setCreatedOperation({
        operationId: data.operationId,
        personId: data.personId,
        state: data.state,
        checklistCount: data.checklist?.length ?? dynamicChecklist.length,
      });
    } catch (err: any) {
      console.warn("API de operaciones no disponible, creando mock local:", err.message);
      const simulatedId = `local-op-${Date.now().toString().slice(-4)}`;
      setCreatedOperation({
        operationId: simulatedId,
        personId: selectedPersonId,
        state: "DRAFT",
        checklistCount: dynamicChecklist.length,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDpi = (val?: string) => {
    if (!val) return "Sin DPI";
    const clean = val.replace(/\D/g, "");
    if (clean.length === 13) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 9)} ${clean.slice(9, 13)}`;
    }
    return val;
  };

  return (
    <CreceAppShell
      activeItem="new-operation"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Solicitantes", href: "/persons" },
        { label: "Apertura de solicitud" },
      ]}
    >
      <CrecePageHeader
        overline="Apertura de Solicitud"
        title="Apertura de Solicitud de Crédito"
        description="Definición de condiciones financieras y resolución de requisitos documentales para el expediente."
        actions={
          <Link href="/persons">
            <CreceButton variant="secondary" icon={IconArrowLeft}>
              Volver a solicitantes
            </CreceButton>
          </Link>
        }
      />

      {createdOperation ? (
        <CreceCard variant="elevated" className="max-w-2xl mx-auto py-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "var(--success-bg)", color: "var(--success)" }}
            >
              <IconCheckCircle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Solicitud aperturada en Borrador
              </h2>
              <p className="text-sm mt-1 text-[var(--text-secondary)]">
                Se generó el expediente con ID <span className="font-mono font-bold">{createdOperation.operationId}</span> para{" "}
                <strong>{selectedPerson?.fullName}</strong>.
              </p>
            </div>

            <div
              className="p-4 rounded-lg border text-left text-xs max-w-lg w-full flex flex-col gap-2.5"
              style={{ background: "var(--bg-subtle)" }}
            >
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Estado:</span>
                <CreceBadge tone="neutral" pill>
                  Borrador
                </CreceBadge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Monto solicitado:</span>
                <strong className="font-mono">
                  Q{amount.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Plazo:</span>
                <span>{termMonths} meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Requisitos del expediente:</span>
                <span className="font-semibold text-[var(--brand)]">
                  {createdOperation.checklistCount} requisitos registrados
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <Link href={`/persons/${createdOperation.personId}`}>
                <CreceButton variant="primary">
                  Ver perfil y expedientes del solicitante
                </CreceButton>
              </Link>
              <Link href="/persons">
                <CreceButton variant="secondary">
                  Ir al listado de solicitantes
                </CreceButton>
              </Link>
            </div>
          </div>
        </CreceCard>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form Fields: 2 Columns */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {formError && (
              <CreceAlert tone="danger" title="Verifique los datos">
                {formError}
              </CreceAlert>
            )}

            {/* 1. Solicitante Asignado */}
            <CreceCard title="1. Solicitante Asignado">
              <div className="flex flex-col gap-4">
                <p className="text-xs text-[var(--text-secondary)]">
                  Seleccione el titular del crédito registrado en el catálogo de personas.
                </p>

                <CreceSelect
                  label="Persona Titular"
                  id="selectedPersonId"
                  name="selectedPersonId"
                  value={selectedPersonId}
                  onChange={(e) => handlePersonChange(e.target.value)}
                  error={fieldErrors.selectedPersonId}
                  options={availablePersons.map((p) => ({
                    value: p.id,
                    label: `${p.fullName} — DPI: ${formatDpi(p.dpi)}`,
                  }))}
                />
              </div>
            </CreceCard>

            {/* 2. Parámetros del Crédito */}
            <CreceCard title="2. Parámetros y Condiciones del Crédito">
              <div className="flex flex-col gap-6">
                {/* Producto */}
                <div>
                  <label className="cr-field__label mb-2">
                    <span>Producto de Crédito</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {[
                      {
                        id: "WORKING_CAPITAL",
                        title: "Capital de Trabajo",
                        desc: "Compra de mercadería, inventario y liquidez inmediata",
                        icon: IconBriefcase,
                      },
                      {
                        id: "INVESTMENT",
                        title: "Inversión y Maquinaria",
                        desc: "Activo fijo, maquinaria, remodelación o herramientas",
                        icon: IconGear,
                      },
                      {
                        id: "MICROCREDIT",
                        title: "Microcrédito",
                        desc: "Pequeña escala para actividades productivas",
                        icon: IconPlant,
                      },
                    ].map((p) => {
                      const IconComp = p.icon;
                      const isSelected = productType === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setProductType(p.id as ProductType)}
                          className={`cr-choice p-4 min-h-[110px] justify-between cursor-pointer ${
                            isSelected ? "border-[var(--brand)] bg-[var(--bg-muted)] shadow-sm" : ""
                          }`}
                          aria-checked={isSelected}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <IconComp
                              size={22}
                              className={isSelected ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}
                            />
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
                            )}
                          </div>
                          <div>
                            <strong className="cr-choice__title block text-sm mb-1">{p.title}</strong>
                            <span className="cr-choice__desc text-xs leading-snug">{p.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tipo de Garantía */}
                <div>
                  <CreceSelect
                    label="Tipo de Garantía"
                    value={guaranteeType}
                    onChange={(e) => setGuaranteeType(e.target.value as GuaranteeType)}
                    options={GUARANTEE_OPTIONS}
                    help="Determina la documentación legal y técnica requerida para el expediente"
                  />
                </div>

                {/* Monto y Plazo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <CreceCurrencyField
                      label="Monto Solicitado (GTQ)"
                      id="amount"
                      name="amount"
                      value={amount}
                      onChange={handleAmountChange}
                      error={fieldErrors.amount}
                      help="Cifra en quetzales guatemaltecos"
                    />
                  </div>

                  <div>
                    <CreceSelect
                      label="Plazo en Meses"
                      id="termMonths"
                      name="termMonths"
                      value={String(termMonths)}
                      onChange={(e) => handleTermMonthsChange(Number(e.target.value))}
                      error={fieldErrors.termMonths}
                      options={TERM_OPTIONS}
                      help="Amortización mensual en cuotas niveladas"
                    />
                  </div>
                </div>

                {/* Destino del crédito */}
                <div>
                  <CreceTextField
                    label="Destino del Crédito"
                    id="purpose"
                    name="purpose"
                    placeholder="Detalle para qué se utilizarán los fondos (ej: Compra de 50 quintales de harina y materia prima)..."
                    multiline
                    rows={3}
                    value={purpose}
                    onChange={(e) => handlePurposeChange(e.target.value)}
                    error={fieldErrors.purpose}
                    help="Descripción específica del destino de los fondos para el expediente"
                    required
                  />
                </div>


                {/* Switch de Fiador */}
                <div className="pt-3 border-t border-[var(--border-default)]">
                  <CreceSwitch
                    id="hasGuarantorSwitch"
                    label="¿Cuenta con Fiador / Codeudor?"
                    description="Si activa esta opción, se requerirá identificación, comprobante de ingresos y verificación crediticia del fiador."
                    checked={hasGuarantor}
                    onChange={setHasGuarantor}
                  />
                </div>
              </div>
            </CreceCard>

            {/* Auditoría y Envío */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[var(--text-secondary)]">
                <span>Registrado por: <strong>Mario Ramos (Jefe de Agencia · Xela)</strong></span>
                <span className="block mt-0.5">Estado inicial: <strong>Borrador</strong></span>
              </div>

              <CreceButton
                type="submit"
                variant="accent"
                size="lg"
                loading={submitting}
                icon={IconCheck}
              >
                Crear solicitud de crédito
              </CreceButton>
            </div>
          </div>

          {/* Right Column: Dynamic Checklist Preview */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <CreceCard
              title={
                <div className="flex items-center justify-between w-full">
                  <span>Requisitos del Expediente</span>
                  <CreceBadge tone="accent">
                    {dynamicChecklist.length} requisitos
                  </CreceBadge>
                </div>
              }
              variant="elevated"
            >
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Documentación requerida para conformar el expediente según el producto, garantía y condiciones seleccionadas:
                </p>

                <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
                  {dynamicChecklist.map((item) => (
                    <div
                      key={item.code}
                      className="p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2"
                      style={{
                        background: item.critical ? "var(--bg-accent-subtle)" : "var(--bg-subtle)",
                        borderColor: item.critical ? "var(--accent)" : "var(--border-default)",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <strong className="block font-semibold" style={{ color: "var(--text-primary)" }}>
                          {item.label}
                        </strong>
                        <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                          {item.code}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {item.required ? (
                          <CreceBadge tone="info" pill>
                            Requerido
                          </CreceBadge>
                        ) : (
                          <CreceBadge tone="neutral" pill>
                            Opcional
                          </CreceBadge>
                        )}
                        {item.critical && (
                          <CreceBadge tone="warning" pill>
                            Crítico
                          </CreceBadge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-2 p-3 rounded-lg text-xs border flex items-start gap-2.5"
                  style={{
                    background: "var(--info-bg)",
                    borderColor: "var(--info)",
                    color: "var(--brand)",
                  }}
                >
                  <IconInfo size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Los documentos serán recibidos, adjuntados y validados durante la etapa de conformación del expediente.</span>
                </div>
              </div>
            </CreceCard>
          </div>
        </form>
      )}
    </CreceAppShell>
  );
}

export default function NewOperationPage() {
  return (
    <Suspense
      fallback={
        <CreceAppShell activeItem="new-operation">
          <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
            Cargando asistente de apertura de solicitud...
          </div>
        </CreceAppShell>
      }
    >
      <NewOperationForm />
    </Suspense>
  );
}
