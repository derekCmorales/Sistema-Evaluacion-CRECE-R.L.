"use client";

import * as React from "react";
import { errorMessage, type ApiRequest } from "../../lib/api";
import { useSession } from "../../lib/session";
import type { CaseFile } from "../../lib/types";

/** Ejecuta una acción del expediente y entrega el expediente actualizado que devuelve la API. */
export function useCaseAction(operationId: string, onSaved: (caseFile: CaseFile) => void) {
  const { request } = useSession();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function run(path: string, method: ApiRequest["method"], body?: unknown): Promise<boolean> {
    setPending(true);
    setError(undefined);
    try {
      onSaved(await request<CaseFile>(`/operations/${operationId}${path}`, { method, body }));
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error, clearError: () => setError(undefined) };
}

export type CasePanelProps = {
  caseFile: CaseFile;
  canEdit: boolean;
  onSaved: (caseFile: CaseFile) => void;
};
