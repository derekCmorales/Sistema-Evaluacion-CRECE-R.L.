"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCrece } from "../../../../lib/crece-ds";
import {
  IMAGE_KIND_LABELS,
  LabApiError,
  RUN_STATUS_LABELS,
  RUN_STATUS_TONE,
  TERMINAL_STATUSES,
  formatSeconds,
  formatUsd,
  labApi,
  waitForRun,
  type LabExtraction,
  type LabMeta,
  type LabRun,
} from "../../../../lib/lab-api";

const MB = 1024 * 1024;

function ExtractionLab() {
  const { Card, Select, FileDrop, Button, Alert, ProgressBar, Badge, Stat, DataTable, Tabs, EmptyState } = useCrece();
  const router = useRouter();
  const params = useSearchParams();
  const runParam = params.get("run");

  const [meta, setMeta] = useState<LabMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState("BUREAU_REPORT");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<LabRun | null>(null);
  const [extraction, setExtraction] = useState<LabExtraction | null>(null);
  const [page, setPage] = useState("1");
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    labApi.meta().then(setMeta, (e: Error) => setMetaError(e.message));
  }, []);

  const follow = useCallback(async (runId: string) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setExtraction(null);
    setError(null);
    try {
      const finished = await waitForRun(runId, setRun, controller.signal);
      if (finished.status !== "FAILED" && finished.output?.extractionId) {
        setExtraction(await labApi.extraction(finished.output.extractionId));
        setPage("1");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (runParam) void follow(runParam);
    return () => abort.current?.abort();
  }, [runParam, follow]);

  const selectedType = meta?.documentTypes.find((t) => t.type === documentType);

  async function submit() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const accepted = await labApi.upload(file, documentType);
      router.replace(`/lab/ia/extraccion?run=${accepted.runId}`);
    } catch (e) {
      setError(e instanceof LabApiError ? e.message : "No se pudo subir el archivo");
    } finally {
      setSubmitting(false);
    }
  }

  const currentPage = extraction?.pages.find((p) => String(p.index) === page);
  const running = run != null && !TERMINAL_STATUSES.includes(run.status);

  const candidateRows = useMemo(
    () =>
      (extraction?.candidates ?? []).map((c) => ({
        ...c,
        pageLabel: c.page ?? "—",
        confidenceLabel: c.confidence == null ? "—" : `${Math.round(c.confidence * 100)} %`,
      })),
    [extraction],
  );

  if (metaError) {
    return (
      <Alert tone="danger" title="El laboratorio no está disponible">
        {metaError}
      </Alert>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      <Card title="Subir documento de prueba">
        <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <Select
              label="Tipo de documento"
              value={documentType}
              onChange={(v: string) => setDocumentType(v)}
              options={(meta?.documentTypes ?? []).filter((t) => t.type !== "POLICY").map((t) => [t.type, t.label] as [string, string])}
              help={
                selectedType?.fields.length
                  ? `Campos: ${selectedType.fields.map((f) => f.label).join(", ")}`
                  : "Solo texto: este tipo no extrae campos"
              }
            />
            <Button variant="primary" onClick={submit} loading={submitting} disabled={!file || submitting || running}>
              Extraer
            </Button>
          </div>
          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            <FileDrop
              title={file ? file.name : "Arrastra un PDF o una imagen"}
              hint={`PDF, JPG o PNG · máximo ${meta ? meta.limits.maxFileBytes / MB : 20} MB y ${meta?.limits.maxPages ?? 60} páginas`}
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onFiles={(files: File[]) => setFile(files[0] ?? null)}
            />
          </div>
        </div>
      </Card>

      {error && (
        <Alert tone="danger" title="No se pudo completar">
          {error}
        </Alert>
      )}

      {run && (
        <Card
          title="Ejecución"
          action={<Badge tone={RUN_STATUS_TONE[run.status]}>{RUN_STATUS_LABELS[run.status]}</Badge>}
        >
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            {running && <ProgressBar value={0} indeterminate label="Extrayendo con OCR" />}
            {run.status === "FAILED" && (
              <Alert tone="danger" title={run.errorCode ?? "Falló"}>
                {run.errorMessage}
              </Alert>
            )}
            <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
              <Stat label="Páginas" value={run.output?.pages ?? "—"} />
              <Stat label="Campos extraídos" value={run.output?.candidateCount ?? "—"} />
              <Stat label="Para revisar" value={run.output?.needsAttentionCount ?? "—"} />
              <Stat label="Tiempo" value={formatSeconds(run.latencyMs)} />
              <Stat label="Costo estimado" value={formatUsd(run.costEstimateUsd)} help={run.output?.reused ? "Reutilizado: sin costo" : undefined} />
              <Stat label="Intentos" value={run.attempts} />
            </div>
            <p className="caption" style={{ color: "var(--text-secondary)" }}>
              Modelo: {run.modelId ?? "—"} · Ejecución {run.id}
            </p>
          </div>
        </Card>
      )}

      {extraction && (
        <>
          <Card title="Campos para confirmación humana">
            <p className="body-sm" style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Son candidatos: nunca se confirman solos ni cambian la evaluación financiera.
            </p>
            <DataTable
              columns={[
                { key: "fieldLabel", label: "Campo" },
                { key: "value", label: "Valor", render: (row: { value: string }) => <span className="cr-tnum">{row.value}</span> },
                { key: "pageLabel", label: "Página", numeric: true },
                { key: "confidenceLabel", label: "Confianza", numeric: true },
                {
                  key: "needsAttention",
                  label: "Estado",
                  render: (row: { needsAttention: boolean; attentionReason?: string }) =>
                    row.needsAttention ? (
                      <span style={{ display: "grid", gap: "var(--space-1)" }}>
                        <Badge tone="warning">Revisar</Badge>
                        <span className="caption" style={{ color: "var(--text-secondary)" }}>
                          {row.attentionReason}
                        </span>
                      </span>
                    ) : (
                      <Badge tone="neutral">Pendiente de confirmación</Badge>
                    ),
                },
              ]}
              rows={candidateRows}
              empty={<EmptyState title="Este tipo de documento no extrae campos" description="Revisa el texto por página." />}
            />
          </Card>

          <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
            <Card title="Documento original">
              {run?.documentRef && (
                <iframe
                  title="Documento original"
                  src={labApi.fileUrl(run.documentRef)}
                  style={{ width: "100%", height: 640, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-surface)" }}
                />
              )}
            </Card>
            <Card title="Texto extraído">
              <Tabs
                tabs={extraction.pages.map((p) => [String(p.index), `Pág. ${p.index}`] as [string, string])}
                value={page}
                onChange={(v: string) => setPage(v)}
              />
              {currentPage && (
                <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
                  <p className="caption" style={{ color: "var(--text-secondary)" }}>
                    Confianza media: {currentPage.confidence == null ? "—" : `${Math.round(currentPage.confidence * 100)} %`}
                    {currentPage.header ? ` · Encabezado: ${currentPage.header}` : ""}
                    {currentPage.footer ? ` · Pie: ${currentPage.footer}` : ""}
                    {currentPage.tableContinuesFromPrevious ? " · La tabla continúa de la página anterior" : ""}
                  </p>
                  <pre
                    style={{
                      margin: 0,
                      maxHeight: 560,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      lineHeight: 1.5,
                      padding: "var(--space-4)",
                      background: "var(--bg-subtle)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    {currentPage.text || "(página sin texto)"}
                  </pre>
                </div>
              )}
            </Card>
          </div>

          <Card title="Imágenes clasificadas">
            <DataTable
              columns={[
                { key: "page", label: "Página", numeric: true },
                { key: "kind", label: "Tipo", render: (row: { kind: string }) => IMAGE_KIND_LABELS[row.kind] ?? row.kind },
                { key: "description", label: "Descripción" },
              ]}
              rows={extraction.images}
              empty={<EmptyState title="Sin imágenes relevantes" description="Logos y decoración se descartan." />}
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default function ExtractionPage() {
  return (
    <Suspense fallback={null}>
      <ExtractionLab />
    </Suspense>
  );
}
