import { describe, expect, it } from "vitest";
import { toDocumentId, toUserId } from "@crece/shared";
import {
  assertOcrDoesNotMutateAssessment,
  confirmOcrCandidate,
  correctOcrCandidate,
  discardOcrCandidate,
  type OcrArtifact,
} from "./ocr-confirmation";

const userId = toUserId("user-1");
const docId = toDocumentId("doc-bureau");

const baseArtifacts: OcrArtifact[] = [
  {
    documentId: docId,
    extractedAt: "2026-01-01T00:00:00.000Z",
    candidates: [
      {
        id: "c1",
        fieldKey: "bureau_delinquency",
        fieldLabel: "Mora prolongada",
        extractedValue: "Sí — 90+ días",
        status: "PENDING",
        sourceDocumentId: docId,
      },
      {
        id: "c2",
        fieldKey: "bureau_debt",
        fieldLabel: "Deuda reportada",
        extractedValue: "Q45,000",
        status: "PENDING",
        sourceDocumentId: docId,
      },
    ],
  },
];

describe("ocr-confirmation", () => {
  it("confirma un candidato pendiente", () => {
    const result = confirmOcrCandidate(
      baseArtifacts,
      "c1",
      userId,
      "2026-01-02T00:00:00.000Z",
    );
    expect(result[0]!.candidates[0]!.status).toBe("CONFIRMED");
    expect(result[0]!.candidates[0]!.confirmedBy).toBe(userId);
  });

  it("corrige un candidato pendiente con valor humano", () => {
    const result = correctOcrCandidate(baseArtifacts, "c2", "Q42,500", userId);
    expect(result[0]!.candidates[1]!.status).toBe("CORRECTED");
    expect(result[0]!.candidates[1]!.correctedValue).toBe("Q42,500");
  });

  it("descarta un candidato pendiente", () => {
    const result = discardOcrCandidate(baseArtifacts, "c1", userId);
    expect(result[0]!.candidates[0]!.status).toBe("DISCARDED");
  });

  it("no permite confirmar dos veces", () => {
    const once = confirmOcrCandidate(baseArtifacts, "c1", userId);
    expect(() => confirmOcrCandidate(once, "c1", userId)).toThrow();
  });

  it("nunca muta la evaluación financiera", () => {
    const assessment = { monthlyIncome: 18000, monthlySales: 45000 };
    assertOcrDoesNotMutateAssessment(assessment, assessment);
    expect(() =>
      assertOcrDoesNotMutateAssessment(assessment, {
        ...assessment,
        monthlyIncome: 20000,
      }),
    ).toThrow();
  });
});
