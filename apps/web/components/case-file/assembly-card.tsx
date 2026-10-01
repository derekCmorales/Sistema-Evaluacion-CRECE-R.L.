"use client";

import { CASE_ASSEMBLY_GAP_LABELS } from "@crece/shared";
import { useCrece } from "../../lib/crece-ds";
import { checklistProgress, dateTime } from "../../lib/view";
import { useCaseAction, type CasePanelProps } from "./use-case-action";

/** Estado de armado (fase 3): huecos visibles y constancia de quién armó el expediente. */
export function AssemblyCard({ caseFile, canEdit, onSaved }: CasePanelProps) {
  const { Card, ProgressBar, List, ListItem, Button, Alert, Badge, Icons } = useCrece();
  const { operation, assembly } = caseFile;
  const { run, pending, error } = useCaseAction(operation.id, onSaved);
  const progress = checklistProgress(operation.checklist);

  return (
    <Card title="Armado del expediente" variant="elevated">
      <div className="cr-stack">
        <ProgressBar
          label="Requisitos obligatorios"
          value={progress.done}
          max={Math.max(progress.total, 1)}
          valueLabel={`${progress.done} de ${progress.total}`}
          tone={progress.done === progress.total ? "success" : undefined}
        />
        {assembly.missingVisibleCount > 0 && (
          <Badge tone="warning">{`${assembly.missingVisibleCount} faltante(s) visible(s)`}</Badge>
        )}

        {assembly.gaps.length === 0 ? (
          <Alert tone="success" title="Sin huecos">
            Checklist, evaluación{operation.hasGuarantor ? ", fiador" : ""} y listas de control completos.
          </Alert>
        ) : (
          <List>
            {assembly.gaps.map((gap) => (
              <ListItem
                key={gap}
                icon={gap === "WATCHLIST_MATCH" ? Icons.WarningCircle : Icons.Clock}
                title={CASE_ASSEMBLY_GAP_LABELS[gap]}
              />
            ))}
          </List>
        )}

        {assembly.assembledAt ? (
          <Alert tone="info" title="Expediente armado">
            {`Por ${assembly.assembledByUserId} el ${dateTime(assembly.assembledAt)}. Cualquier cambio posterior borra esta constancia.`}
          </Alert>
        ) : (
          canEdit && (
            <Button
              variant="primary"
              block
              icon={Icons.SealCheck}
              loading={pending}
              disabled={pending || !assembly.readyForReview}
              onClick={() => void run("/assemble", "POST")}
            >
              Marcar expediente armado
            </Button>
          )
        )}
        {error && <Alert tone="danger">{error}</Alert>}
        <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
          Siguiente fase: cálculo final, excepciones a reglas duras y envío a revisión.
        </p>
      </div>
    </Card>
  );
}
