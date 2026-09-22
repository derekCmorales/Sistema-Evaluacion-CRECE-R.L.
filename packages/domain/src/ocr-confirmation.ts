import type { DocumentId, OcrCandidateStatus, UserId } from "@crece/shared";
import { InvariantViolationError, ValidationError } from "@crece/shared";

export type OcrCandidate = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  extractedValue: string;
  status: OcrCandidateStatus;
  sourceDocumentId: DocumentId;
  correctedValue?: string;
  confirmedAt?: string;
  confirmedBy?: UserId;
};

export type OcrArtifact = {
  documentId: DocumentId;
  extractedAt: string;
  candidates: OcrCandidate[];
};

function updateCandidate(
  artifacts: OcrArtifact[],
  candidateId: string,
  updater: (candidate: OcrCandidate) => OcrCandidate,
): OcrArtifact[] {
  let found = false;
  const next = artifacts.map((artifact) => ({
    ...artifact,
    candidates: artifact.candidates.map((candidate) => {
      if (candidate.id !== candidateId) return candidate;
      found = true;
      return updater(candidate);
    }),
  }));

  if (!found) throw new ValidationError("Candidato OCR no encontrado");
  return next;
}

export function confirmOcrCandidate(
  artifacts: OcrArtifact[],
  candidateId: string,
  byUserId: UserId,
  at = new Date().toISOString(),
): OcrArtifact[] {
  return updateCandidate(artifacts, candidateId, (candidate) => {
    if (candidate.status !== "PENDING") {
      throw new ValidationError("Solo se pueden confirmar candidatos pendientes");
    }
    return {
      ...candidate,
      status: "CONFIRMED",
      confirmedAt: at,
      confirmedBy: byUserId,
    };
  });
}

export function correctOcrCandidate(
  artifacts: OcrArtifact[],
  candidateId: string,
  correctedValue: string,
  byUserId: UserId,
  at = new Date().toISOString(),
): OcrArtifact[] {
  const value = correctedValue.trim();
  if (!value) throw new ValidationError("El valor corregido es obligatorio");

  return updateCandidate(artifacts, candidateId, (candidate) => {
    if (candidate.status !== "PENDING") {
      throw new ValidationError("Solo se pueden corregir candidatos pendientes");
    }
    return {
      ...candidate,
      status: "CORRECTED",
      correctedValue: value,
      confirmedAt: at,
      confirmedBy: byUserId,
    };
  });
}

export function discardOcrCandidate(
  artifacts: OcrArtifact[],
  candidateId: string,
  byUserId: UserId,
  at = new Date().toISOString(),
): OcrArtifact[] {
  return updateCandidate(artifacts, candidateId, (candidate) => {
    if (candidate.status !== "PENDING") {
      throw new ValidationError("Solo se pueden descartar candidatos pendientes");
    }
    return {
      ...candidate,
      status: "DISCARDED",
      confirmedAt: at,
      confirmedBy: byUserId,
    };
  });
}

export function countPendingOcrCandidates(artifacts: OcrArtifact[]): number {
  return artifacts.reduce(
    (sum, artifact) =>
      sum + artifact.candidates.filter((c) => c.status === "PENDING").length,
    0,
  );
}

/** Los artefactos OCR son derivados: jamás mutan FinancialAssessment. */
export function assertOcrDoesNotMutateAssessment<T>(
  assessmentBefore: T,
  assessmentAfter: T,
): void {
  if (JSON.stringify(assessmentBefore) !== JSON.stringify(assessmentAfter)) {
    throw new InvariantViolationError(
      "Los valores OCR no pueden modificar la evaluación financiera",
    );
  }
}
