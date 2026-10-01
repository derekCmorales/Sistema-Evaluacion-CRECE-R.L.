"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GUARANTEE_TYPE_LABELS,
  PRODUCT_TYPE_LABELS,
  type GuaranteeType,
  type PersonListItem,
  type ProductType,
} from "@crece/shared";
import type { ChecklistItem } from "@crece/domain";
import { useCrece } from "../../../../lib/crece-ds";
import { useSession } from "../../../../lib/session";
import { useApiData } from "../../../../lib/use-api";
import { errorMessage } from "../../../../lib/api";
import type { CaseFile } from "../../../../lib/types";

type Draft = {
  personId: string;
  productType: ProductType;
  guaranteeType: GuaranteeType;
  requestedAmount: number | "";
  termMonths: number;
  purpose: string;
  hasGuarantor: boolean;
};

function NewOperationForm() {
  const { PageHeader, Card, Select, ChoiceCards, CurrencyField, NumberStepper, TextField, Switch, List, ListItem, Badge, Button, Alert, Link, Icons } =
    useCrece();
  const router = useRouter();
  const params = useSearchParams();
  const { request, can } = useSession();
  const persons = useApiData<{ items: PersonListItem[] }>("/persons");
  const [draft, setDraft] = React.useState<Draft>({
    personId: params.get("personId") ?? "",
    productType: "WORKING_CAPITAL",
    guaranteeType: "PERSONAL",
    requestedAmount: "",
    termMonths: 24,
    purpose: "",
    hasGuarantor: false,
  });
  const preview = useApiData<{ items: ChecklistItem[] }>(
    `/operations/checklist?productType=${draft.productType}&guaranteeType=${draft.guaranteeType}&hasGuarantor=${draft.hasGuarantor}`,
  );
  const [formError, setFormError] = React.useState<string>();
  const [saving, setSaving] = React.useState(false);

  const eligible = (persons.data?.items ?? []).filter((p) => p.dpiMasked);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    setSaving(true);
    try {
      const { operation } = await request<CaseFile>("/operations", { method: "POST", body: draft });
      router.push(`/operations/${operation.id}`);
    } catch (err) {
      setFormError(errorMessage(err));
      setSaving(false);
    }
  }

  if (!can("operation:create")) {
    return (
      <>
        <PageHeader overline="Fase 2 · Apertura" title="Abrir solicitud" />
        <Alert tone="info" title="Tu cargo consulta, no origina">
          Cambia a una sesión de Jefatura o asesor para abrir solicitudes.
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        overline="Fase 2 · Apertura"
        title="Abrir solicitud"
        description="La solicitud nace en borrador. El checklist sale del producto, la garantía y el fiador."
      />

      <div className="layout-detail">
        <Card>
          <form className="cr-stack" onSubmit={submit} noValidate>
            <Select
              label="Solicitante"
              help="Solo aparecen personas con DPI. A un prospecto de la landing complétale el DPI en su perfil."
              placeholder={persons.loading ? "Cargando…" : "Elige al solicitante"}
              value={draft.personId}
              onChange={(v: string) => update("personId", v)}
              options={eligible.map((p) => [p.id, `${p.fullName} · ${p.dpiMasked}`])}
              error={persons.error ?? undefined}
            />

            <ChoiceCards
              label="Producto"
              value={draft.productType}
              onChange={(v: ProductType) => update("productType", v)}
              options={[
                { value: "WORKING_CAPITAL", title: PRODUCT_TYPE_LABELS.WORKING_CAPITAL, icon: Icons.Storefront },
                { value: "INVESTMENT", title: PRODUCT_TYPE_LABELS.INVESTMENT, icon: Icons.Buildings },
                { value: "MICROCREDIT", title: PRODUCT_TYPE_LABELS.MICROCREDIT, icon: Icons.HandCoins },
              ]}
            />

            <div className="cr-grid">
              <Select
                label="Garantía"
                value={draft.guaranteeType}
                onChange={(v: GuaranteeType) => update("guaranteeType", v)}
                options={(Object.keys(GUARANTEE_TYPE_LABELS) as GuaranteeType[]).map((g) => [g, GUARANTEE_TYPE_LABELS[g]])}
              />
              <CurrencyField
                label="Monto solicitado"
                value={draft.requestedAmount}
                onChange={(n: number | "") => update("requestedAmount", n)}
              />
            </div>

            <div className="cr-row">
              <span className="label-md">Plazo</span>
              <NumberStepper
                label="Plazo en meses"
                value={draft.termMonths}
                min={1}
                max={120}
                onChange={(n: number) => update("termMonths", n)}
                format={(n: number) => `${n} meses`}
              />
            </div>

            <TextField
              label="Destino del crédito"
              multiline
              rows={3}
              maxLength={300}
              value={draft.purpose}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update("purpose", e.target.value)}
            />

            <Switch
              label="Lleva fiador"
              description="Suma al checklist el DPI, los ingresos y el buró del fiador."
              checked={draft.hasGuarantor}
              onChange={(checked: boolean) => update("hasGuarantor", checked)}
            />

            {formError && <Alert tone="danger" title="No pudimos abrir la solicitud">{formError}</Alert>}

            <div className="form-actions">
              <Link onClick={() => router.back()}>Cancelar</Link>
              <Button variant="primary" type="submit" loading={saving} disabled={saving}>
                Abrir en borrador
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Checklist que se generará" variant="tinted">
          {preview.error ? (
            <Alert tone="danger">{preview.error}</Alert>
          ) : (
            <List>
              {(preview.data?.items ?? []).map((item) => (
                <ListItem
                  key={item.code}
                  icon={Icons.FileText}
                  title={item.label}
                  trailing={<Badge tone={item.required ? "info" : "neutral"}>{item.required ? "Obligatorio" : "Opcional"}</Badge>}
                />
              ))}
            </List>
          )}
        </Card>
      </div>
    </>
  );
}

export default function NewOperationPage() {
  return (
    <Suspense>
      <NewOperationForm />
    </Suspense>
  );
}
