"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CHECKLIST_STATUS_LABELS, formatGtq, type ChecklistItemStatus } from "@crece/shared";
import { hasPermission } from "@crece/application";
import { useCrece } from "../../../lib/crece-ds";
import { api } from "../../../lib/api";
import { useSession } from "../../../lib/session";

type ChecklistItem = {
  code: string;
  label: string;
  status: ChecklistItemStatus;
  required: boolean;
  notApplicableReason?: string;
};

type OperationDetail = {
  id: string;
  purpose: string;
  requestedAmount: { amount: number };
  termMonths: number;
  checklist: ChecklistItem[];
  assessment?: { monthlyIncome: number };
  guarantor?: { fullName: string; dpi?: string };
  calcResult?: { installment: { amount: number }; installmentToIncomeRatio: number };
  hardRuleHits: { ruleCode: string; message: string; severity: string }[];
  assembledAt?: string;
};

type Assembly = {
  checklistComplete: boolean;
  hasFinancialAssessment: boolean;
  watchlistChecksCompleted: boolean;
  readyForReview: boolean;
  watchlistGaps: { source: string; reason: string }[];
  pendingChecklistCount: number;
};

const GAP_LABEL: Record<string, string> = {
  MISSING: "Falta la consulta",
  MATCH_FOUND: "Coincidencia",
  PENDING_MANUAL_REVIEW: "Revisión manual",
};

export default function ExpedientePage() {
  const crece = useCrece();
  const session = useSession();
  const params = useParams<{ id: string }>();
  const [operation, setOperation] = useState<OperationDetail | null>(null);
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("checklist");
  const readOnly = !hasPermission(session.offices, "operation:edit");

  const reload = useCallback(() => {
    Promise.all([
      api<OperationDetail>(`/operations/${params.id}`, session),
      api<Assembly>(`/operations/${params.id}/assembly-status`, session),
    ])
      .then(([op, status]) => {
        setOperation(op);
        setAssembly(status);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.id, session]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!crece) return null;
  const { PageHeader, Card, Tabs, Alert, Badge, Button, Select, TextField, DescriptionList } = crece;

  async function saveChecklist(item: ChecklistItem, status: string, reason: string) {
    setError("");
    try {
      await api(`/operations/${params.id}/checklist`, session, {
        method: "PATCH",
        body: JSON.stringify({
          code: item.code,
          status,
          notApplicableReason: reason || undefined,
          documentId: status === "UPLOADED" || status === "CONFIRMED" ? `doc-${item.code}` : undefined,
        }),
      });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    }
  }

  return (
    <>
      <PageHeader
        overline="Fase 3"
        title="Expediente"
        description={operation ? operation.purpose : "Armado del caso"}
      />
      {operation?.assembledAt ? (
        <Alert tone="success" title="Expediente armado">
          Quedó registrada la persona que armó el caso. El sistema no aprueba ni rechaza.
        </Alert>
      ) : null}
      {readOnly ? (
        <Alert tone="info" title="Solo lectura">
          Con este cargo puedes consultar el expediente. No puedes modificarlo.
        </Alert>
      ) : null}
      {error ? <Alert tone="danger" title="Revisa el paso">{error}</Alert> : null}
      {assembly ? (
        <Card title="Estado del armado">
          <DescriptionList
            items={[
              ["Checklist", assembly.checklistComplete ? "Listo" : `${assembly.pendingChecklistCount} pendientes`],
              ["Evaluación", assembly.hasFinancialAssessment ? "Capturada" : "Falta"],
              ["Listas", assembly.watchlistChecksCompleted ? "Sin huecos" : "Con hueco visible"],
              ["Listo para revisión", assembly.readyForReview ? "Sí" : "Todavía no"],
            ]}
          />
          {assembly.watchlistGaps.map((gap) => (
            <Badge key={gap.source} tone="warning">
              {`${gap.source}: ${GAP_LABEL[gap.reason] ?? gap.reason}`}
            </Badge>
          ))}
        </Card>
      ) : null}
      <Tabs
        tabs={[
          ["checklist", "Checklist"],
          ["evaluacion", "Evaluación"],
          ["fiador", "Fiador"],
          ["listas", "Listas"],
        ]}
        value={tab}
        onChange={(value: string) => setTab(value)}
      />
      {tab === "checklist" && operation
        ? operation.checklist.map((item) => (
            <ChecklistRow
              key={item.code}
              item={item}
              readOnly={readOnly}
              crece={crece}
              onSave={saveChecklist}
            />
          ))
        : null}
      {tab === "evaluacion" ? (
        <AssessmentForm
          crece={crece}
          readOnly={readOnly}
          operationId={params.id}
          session={session}
          onDone={reload}
          summary={
            operation?.calcResult
              ? `Cuota calculada ${formatGtq(operation.calcResult.installment.amount)}`
              : undefined
          }
          hits={operation?.hardRuleHits ?? []}
        />
      ) : null}
      {tab === "fiador" ? (
        <GuarantorForm
          crece={crece}
          readOnly={readOnly}
          operationId={params.id}
          session={session}
          onDone={reload}
          current={operation?.guarantor}
        />
      ) : null}
      {tab === "listas" ? (
        <WatchlistForm
          crece={crece}
          readOnly={readOnly}
          operationId={params.id}
          session={session}
          onDone={reload}
        />
      ) : null}
      {!readOnly && assembly?.readyForReview ? (
        <Button
          onClick={() =>
            api(`/operations/${params.id}/assemble`, session, { method: "POST" }).then(reload)
          }
        >
          Marcar expediente armado
        </Button>
      ) : null}
    </>
  );
}

function ChecklistRow({
  item,
  readOnly,
  crece,
  onSave,
}: {
  item: ChecklistItem;
  readOnly: boolean;
  crece: NonNullable<ReturnType<typeof useCrece>>;
  onSave: (item: ChecklistItem, status: string, reason: string) => void;
}) {
  const { Card, Select, TextField, Button, Badge } = crece!;
  const [status, setStatus] = useState(item.status);
  const [reason, setReason] = useState(item.notApplicableReason ?? "");
  return (
    <Card title={item.label}>
      <Badge tone={item.required ? "info" : "neutral"}>{item.required ? "Obligatorio" : "Opcional"}</Badge>
      <Select
        label="Estado"
        value={status}
        disabled={readOnly}
        onChange={(value: string) => setStatus(value as ChecklistItemStatus)}
        options={Object.entries(CHECKLIST_STATUS_LABELS)}
      />
      {status === "NOT_APPLICABLE" ? (
        <TextField
          label="Por qué no aplica"
          value={reason}
          disabled={readOnly}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setReason(event.target.value)}
        />
      ) : null}
      {readOnly ? null : (
        <Button variant="secondary" onClick={() => onSave(item, status, reason)}>
          Guardar requisito
        </Button>
      )}
    </Card>
  );
}

function AssessmentForm({
  crece,
  readOnly,
  operationId,
  session,
  onDone,
  summary,
  hits,
}: {
  crece: NonNullable<ReturnType<typeof useCrece>>;
  readOnly: boolean;
  operationId: string;
  session: { userId: string; offices: string[] };
  onDone: () => void;
  summary?: string;
  hits: { ruleCode: string; message: string; severity: string }[];
}) {
  const { Card, TextField, Button, Alert } = crece!;
  const [monthlySales, setMonthlySales] = useState("30000");
  const [monthlyIncome, setMonthlyIncome] = useState("12000");
  const [monthlyExpenses, setMonthlyExpenses] = useState("6000");
  const [existingDebtPayment, setExistingDebtPayment] = useState("800");
  const [guaranteeValue, setGuaranteeValue] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/operations/${operationId}/assessment`, session, {
        method: "POST",
        body: JSON.stringify({
          monthlySales: Number(monthlySales),
          monthlyIncome: Number(monthlyIncome),
          monthlyExpenses: Number(monthlyExpenses),
          existingDebtPayment: Number(existingDebtPayment),
          guaranteeValue: guaranteeValue === "" ? undefined : Number(guaranteeValue),
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  return (
    <Card title="Evaluación financiera">
      <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
        {summary ? <Alert tone="info" title="Calculado">{summary}</Alert> : null}
        {error ? <Alert tone="danger" title="Dato no numérico o inválido">{error}</Alert> : null}
        {hits.map((hit) => (
          <Alert key={hit.ruleCode} tone={hit.severity === "BLOCK" ? "danger" : "warning"} title={hit.ruleCode}>
            {hit.message}
          </Alert>
        ))}
        <TextField label="Ventas mensuales" disabled={readOnly} value={monthlySales} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMonthlySales(event.target.value)} />
        <TextField label="Ingresos mensuales" disabled={readOnly} value={monthlyIncome} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMonthlyIncome(event.target.value)} />
        <TextField label="Gastos mensuales" disabled={readOnly} value={monthlyExpenses} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMonthlyExpenses(event.target.value)} />
        <TextField label="Cuota de deudas" disabled={readOnly} value={existingDebtPayment} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setExistingDebtPayment(event.target.value)} />
        <TextField label="Valor de la garantía" optional disabled={readOnly} value={guaranteeValue} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setGuaranteeValue(event.target.value)} />
        {readOnly ? null : <Button type="submit">Guardar evaluación</Button>}
      </form>
    </Card>
  );
}

function GuarantorForm({
  crece,
  readOnly,
  operationId,
  session,
  onDone,
  current,
}: {
  crece: NonNullable<ReturnType<typeof useCrece>>;
  readOnly: boolean;
  operationId: string;
  session: { userId: string; offices: string[] };
  onDone: () => void;
  current?: { fullName: string; dpi?: string };
}) {
  const { Card, TextField, Button, Alert } = crece!;
  const [fullName, setFullName] = useState(current?.fullName ?? "");
  const [dpi, setDpi] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/operations/${operationId}/guarantor`, session, {
        method: "POST",
        body: JSON.stringify({ fullName, dpi: dpi || undefined }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el fiador");
    }
  }

  return (
    <Card title="Fiador">
      <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
        {current ? <Alert tone="success" title="Fiador registrado">{current.fullName}</Alert> : null}
        {error ? <Alert tone="danger" title="No se agregó">{error}</Alert> : null}
        <TextField label="Nombre" disabled={readOnly} value={fullName} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)} />
        <TextField label="DPI" help="Se normaliza a 13 dígitos" disabled={readOnly} value={dpi} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDpi(event.target.value)} />
        {readOnly ? null : <Button type="submit">Agregar fiador</Button>}
      </form>
    </Card>
  );
}

function WatchlistForm({
  crece,
  readOnly,
  operationId,
  session,
  onDone,
}: {
  crece: NonNullable<ReturnType<typeof useCrece>>;
  readOnly: boolean;
  operationId: string;
  session: { userId: string; offices: string[] };
  onDone: () => void;
}) {
  const { Card, Select, TextField, Button, Alert } = crece!;
  const [source, setSource] = useState("OFAC");
  const [result, setResult] = useState("CLEAR");
  const [queryRef, setQueryRef] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/operations/${operationId}/watchlist`, session, {
        method: "POST",
        body: JSON.stringify({
          source,
          result,
          queryRef,
          checkedByUserId: session.userId,
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    }
  }

  return (
    <Card title="Listas de control">
      <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
        {error ? <Alert tone="danger" title="Consulta no registrada">{error}</Alert> : null}
        <Select
          label="Lista"
          value={source}
          disabled={readOnly}
          onChange={(value: string) => setSource(value)}
          options={[
            ["OFAC", "OFAC"],
            ["ONU", "ONU"],
            ["GUATECOMPRAS", "Guatecompras"],
          ]}
        />
        <Select
          label="Resultado"
          value={result}
          disabled={readOnly}
          onChange={(value: string) => setResult(value)}
          options={[
            ["CLEAR", "Sin coincidencia"],
            ["MATCH_FOUND", "Coincidencia"],
            ["PENDING_MANUAL_REVIEW", "Revisión manual"],
          ]}
        />
        <TextField label="Referencia consultada" disabled={readOnly} value={queryRef} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQueryRef(event.target.value)} />
        {readOnly ? null : <Button type="submit">Registrar consulta</Button>}
      </form>
    </Card>
  );
}
