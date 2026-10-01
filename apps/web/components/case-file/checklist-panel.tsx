"use client";

import * as React from "react";
import { CHECKLIST_STATUS_LABELS, type ChecklistItemStatus } from "@crece/shared";
import type { ChecklistItem } from "@crece/domain";
import { useCrece } from "../../lib/crece-ds";
import { checklistTone } from "../../lib/view";
import { useCaseAction, type CasePanelProps } from "./use-case-action";

const STATUSES: ChecklistItemStatus[] = ["PENDING", "UPLOADED", "CONFIRMED", "MISSING_VISIBLE", "NOT_APPLICABLE"];

/** C-04: cada requisito con su estado; «No aplica» pide motivo; el faltante visible deja avanzar. */
export function ChecklistPanel({ caseFile, canEdit, onSaved }: CasePanelProps) {
  const { Card, List, ListItem, Badge, Select, Dialog, TextField, Button, Alert, Icons } = useCrece();
  const { run, pending, error } = useCaseAction(caseFile.operation.id, onSaved);
  const [naItem, setNaItem] = React.useState<ChecklistItem | null>(null);
  const [reason, setReason] = React.useState("");

  function change(item: ChecklistItem, status: ChecklistItemStatus) {
    if (status === "NOT_APPLICABLE") {
      setReason(item.notApplicableReason ?? "");
      setNaItem(item);
      return;
    }
    void run("/checklist", "PATCH", { code: item.code, status });
  }

  async function confirmNotApplicable() {
    if (!naItem) return;
    const ok = await run("/checklist", "PATCH", { code: naItem.code, status: "NOT_APPLICABLE", notApplicableReason: reason });
    if (ok) setNaItem(null);
  }

  return (
    <Card title="Requisitos del expediente">
      <div className="cr-stack">
        <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
          La carga de archivos llega con el change de almacenamiento; por ahora se registra el estado de cada requisito.
        </p>
        {error && !naItem && <Alert tone="danger" title="No se guardó el cambio">{error}</Alert>}
        <List>
          {caseFile.operation.checklist.map((item) => (
            <ListItem
              key={item.code}
              icon={item.required ? Icons.FileText : Icons.Paperclip}
              title={item.label}
              description={
                item.status === "NOT_APPLICABLE" && item.notApplicableReason
                  ? `No aplica: ${item.notApplicableReason}`
                  : item.required
                    ? "Obligatorio"
                    : "Opcional"
              }
              trailing={
                canEdit ? (
                  <Select
                    label="Estado"
                    value={item.status}
                    disabled={pending}
                    onChange={(v: ChecklistItemStatus) => change(item, v)}
                    options={STATUSES.map((s) => [s, CHECKLIST_STATUS_LABELS[s]])}
                  />
                ) : (
                  <Badge tone={checklistTone(item.status)}>{CHECKLIST_STATUS_LABELS[item.status]}</Badge>
                )
              }
            />
          ))}
        </List>
      </div>

      <Dialog
        open={naItem !== null}
        title="Marcar como «No aplica»"
        icon={Icons.Info}
        onClose={() => setNaItem(null)}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setNaItem(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="button" loading={pending} disabled={pending} onClick={confirmNotApplicable}>
              Guardar motivo
            </Button>
          </>
        }
      >
        <div className="cr-stack">
          <p className="body-md">{naItem?.label}</p>
          <TextField
            label="Motivo"
            help="Queda en la bitácora. Escribe por qué este requisito no aplica a esta solicitud."
            multiline
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            error={naItem ? error : undefined}
          />
        </div>
      </Dialog>
    </Card>
  );
}
