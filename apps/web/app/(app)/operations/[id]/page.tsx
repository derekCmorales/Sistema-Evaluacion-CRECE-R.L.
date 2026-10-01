"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  GUARANTEE_TYPE_LABELS,
  OPERATION_STATE_LABELS,
  PRODUCT_TYPE_LABELS,
  formatDpi,
} from "@crece/shared";
import { useCrece } from "../../../../lib/crece-ds";
import { useSession } from "../../../../lib/session";
import { useApiData } from "../../../../lib/use-api";
import type { CaseFile, PersonProfile } from "../../../../lib/types";
import { checklistProgress, dateTime, money, operationStateTone } from "../../../../lib/view";
import { AssemblyCard } from "../../../../components/case-file/assembly-card";
import { AssessmentPanel } from "../../../../components/case-file/assessment-panel";
import { ChecklistPanel } from "../../../../components/case-file/checklist-panel";
import { GuarantorPanel } from "../../../../components/case-file/guarantor-panel";
import { HistoryPanel } from "../../../../components/case-file/history-panel";
import { WatchlistPanel } from "../../../../components/case-file/watchlist-panel";
import { CalcTab } from "../../../../components/case-file/calc-tab";
import { OpinionTab } from "../../../../components/case-file/opinion-tab";
import { AiReviewTab } from "../../../../components/case-file/ai-review-tab";
import { DecisionTab } from "../../../../components/case-file/decision-tab";

/** Fases 1–3 (captura) y una pestaña por carril del sprint 2; cada carril llena su archivo. */
type Tab =
  | "checklist"
  | "assessment"
  | "guarantor"
  | "watchlist"
  | "calc"
  | "opinion"
  | "ai-review"
  | "decision"
  | "history";

/** C-03 en etapa Captura: expediente de la solicitud (fase 3). */
export default function CaseFilePage() {
  const { id } = useParams<{ id: string }>();
  const { PageHeader, Breadcrumbs, Tabs, Badge, Card, DescriptionList, Alert, Skeleton } = useCrece();
  const { can } = useSession();
  const caseFile = useApiData<CaseFile>(`/operations/${id}`);
  const personId = caseFile.data?.operation.personId;
  const profile = useApiData<PersonProfile>(personId ? `/persons/${personId}` : null);
  const [tab, setTab] = React.useState<Tab>("checklist");

  const personName = profile.data?.person.fullName ?? "Solicitante";
  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: "Solicitantes", href: "/persons" },
        { label: personName, href: personId ? `/persons/${personId}` : "/persons" },
        { label: "Expediente" },
      ]}
    />
  );

  if (caseFile.error) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} title="Expediente" />
        <Alert tone="danger" title="No pudimos abrir el expediente">{caseFile.error}</Alert>
      </>
    );
  }
  if (!caseFile.data) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} title="Expediente" />
        <Skeleton lines={8} />
      </>
    );
  }

  const data = caseFile.data;
  const { operation, assembly } = data;
  const { canEdit } = data;
  const onSaved = (next: CaseFile) => caseFile.setData(next);
  const progress = checklistProgress(operation.checklist);
  const panelProps = { caseFile: data, canEdit, onSaved };

  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        overline="Fase 3 · Armado del expediente"
        title={`${personName} · ${money(operation.requestedAmount.amount)}`}
        description={operation.purpose}
        actions={<Badge tone={operationStateTone(operation.state)}>{OPERATION_STATE_LABELS[operation.state]}</Badge>}
      />

      {!canEdit && (
        <Alert tone="info" title="Solo lectura">
          {can("operation:edit")
            ? "La solicitud ya no está en borrador ni devuelta: el expediente no se edita."
            : "Tu cargo consulta el expediente; la captura la hace Jefatura o el asesor."}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(v: Tab) => setTab(v)}
        tabs={[
          ["checklist", "Checklist", `${progress.done}/${progress.total}`],
          ["assessment", "Evaluación"],
          ["guarantor", "Fiador"],
          ["watchlist", "Listas de control"],
          ["calc", "Cálculo y reglas"],
          ["opinion", "Dictamen"],
          ["ai-review", "Revisión IA"],
          ["decision", "Decisión"],
          ["history", "Bitácora"],
        ]}
      />

      <div className="layout-detail">
        <div key={tab}>
          {tab === "checklist" && <ChecklistPanel {...panelProps} />}
          {tab === "assessment" && <AssessmentPanel {...panelProps} />}
          {tab === "guarantor" && <GuarantorPanel {...panelProps} />}
          {tab === "watchlist" && (
            <WatchlistPanel {...panelProps} defaultQuery={profile.data?.person.dpi ? formatDpi(profile.data.person.dpi) : personName} />
          )}
          {tab === "calc" && <CalcTab {...panelProps} />}
          {tab === "opinion" && <OpinionTab {...panelProps} />}
          {tab === "ai-review" && <AiReviewTab {...panelProps} />}
          {tab === "decision" && <DecisionTab {...panelProps} />}
          {tab === "history" && (
            <HistoryPanel
              operationId={operation.id}
              version={operation.updatedAt}
              checklistLabels={Object.fromEntries(operation.checklist.map((i) => [i.code, i.label]))}
            />
          )}
        </div>

        <div className="cr-stack">
          <AssemblyCard {...panelProps} />
          <Card title="Solicitud">
            <DescriptionList
              items={[
                ["Producto", PRODUCT_TYPE_LABELS[operation.productType]],
                ["Garantía", GUARANTEE_TYPE_LABELS[operation.guaranteeType]],
                ["Monto", money(operation.requestedAmount.amount)],
                ["Plazo", `${operation.termMonths} meses`],
                ["Fiador", operation.hasGuarantor ? operation.guarantor?.fullName ?? "Por registrar" : "No lleva"],
                ["Abrió", operation.createdBy],
                ["Apertura", dateTime(operation.createdAt)],
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
