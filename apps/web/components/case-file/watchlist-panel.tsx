"use client";

import * as React from "react";
import {
  WATCHLIST_RESULT_LABELS,
  WATCHLIST_SOURCE_LABELS,
  type WatchlistResult,
  type WatchlistSource,
} from "@crece/shared";
import { useCrece } from "../../lib/crece-ds";
import { dateTime, watchlistTone } from "../../lib/view";
import { useCaseAction, type CasePanelProps } from "./use-case-action";

const SOURCES = Object.keys(WATCHLIST_SOURCE_LABELS) as WatchlistSource[];
const RESULTS = Object.keys(WATCHLIST_RESULT_LABELS) as WatchlistResult[];

/** Registro manual de consultas a OFAC, ONU y Guatecompras. Vale la más reciente por lista. */
export function WatchlistPanel({ caseFile, canEdit, onSaved, defaultQuery }: CasePanelProps & { defaultQuery: string }) {
  const { Card, List, ListItem, Badge, Select, TextField, RadioGroup, Button, Alert, Icons } = useCrece();
  const { operation, assembly } = caseFile;
  const { run, pending, error } = useCaseAction(operation.id, onSaved);
  const [source, setSource] = React.useState<WatchlistSource>(
    assembly.watchlist.find((s) => s.result !== "CLEAR")?.source ?? "OFAC",
  );
  const [queryRef, setQueryRef] = React.useState(defaultQuery);
  const [result, setResult] = React.useState<WatchlistResult>("CLEAR");
  const [notes, setNotes] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await run("/watchlist", "POST", { source, queryRef, result, notes: notes || undefined })) {
      setNotes("");
    }
  }

  const history = [...(operation.watchlistChecks ?? [])].reverse();

  return (
    <div className="cr-stack">
      <Card title="Listas de control">
        <List>
          {assembly.watchlist.map((s) => (
            <ListItem
              key={s.source}
              icon={Icons.ShieldCheck}
              title={WATCHLIST_SOURCE_LABELS[s.source]}
              description={s.latest ? `${dateTime(s.latest.checkedAt)} · ${s.latest.notes ?? "Sin notas"}` : "Sin consultar"}
              trailing={
                <Badge tone={watchlistTone(s.result)}>
                  {s.result === "MISSING" ? "Pendiente" : WATCHLIST_RESULT_LABELS[s.result]}
                </Badge>
              }
            />
          ))}
        </List>
      </Card>

      {canEdit && (
        <Card title="Registrar consulta">
          <form className="cr-stack" onSubmit={submit} noValidate>
            <p className="body-sm" style={{ color: "var(--text-secondary)" }}>
              El sistema no consulta las listas por sí mismo: registra aquí lo que encontraste en el portal oficial.
            </p>
            <div className="cr-grid">
              <Select
                label="Lista"
                value={source}
                onChange={(v: WatchlistSource) => setSource(v)}
                options={SOURCES.map((s) => [s, WATCHLIST_SOURCE_LABELS[s]])}
              />
              <TextField
                label="Qué se consultó"
                help="Nombre o DPI tal como se buscó"
                autoComplete="off"
                value={queryRef}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQueryRef(e.target.value)}
              />
            </div>
            <RadioGroup
              label="Resultado"
              row
              value={result}
              onChange={(v: WatchlistResult) => setResult(v)}
              options={RESULTS.map((r) => [r, WATCHLIST_RESULT_LABELS[r]])}
            />
            <TextField
              label="Notas"
              optional={result !== "MATCH_FOUND"}
              help={result === "MATCH_FOUND" ? "Obligatorio: qué registro coincidió y con qué datos" : "Referencia de la consulta o constancia"}
              multiline
              rows={2}
              maxLength={300}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            />
            {error && <Alert tone="danger" title="No se registró la consulta">{error}</Alert>}
            <div className="form-actions">
              <Button variant="primary" type="submit" loading={pending} disabled={pending}>
                Registrar consulta
              </Button>
            </div>
          </form>
        </Card>
      )}

      {history.length > 0 && (
        <Card title="Consultas registradas">
          <List>
            {history.map((c) => (
              <ListItem
                key={c.id}
                title={`${WATCHLIST_SOURCE_LABELS[c.source]} · ${c.queryRef}`}
                description={`${dateTime(c.checkedAt)} · ${c.checkedByUserId}${c.notes ? ` · ${c.notes}` : ""}`}
                trailing={<Badge tone={watchlistTone(c.result)}>{WATCHLIST_RESULT_LABELS[c.result]}</Badge>}
              />
            ))}
          </List>
        </Card>
      )}
    </div>
  );
}
