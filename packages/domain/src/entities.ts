import type {
  DocumentId,
  Money,
  OperationId,
  PersonId,
  PersonStatus,
  ProductType,
  GuaranteeType,
  SavingsOperationType,
  UserId,
  Opinion5C,
} from "@crece/shared";
import type { CalcResult, FinancialAssessmentInput, GuarantorAssessmentInput } from "./calc-engine";
import type { ChecklistItem } from "./checklist-resolver";
import type { HardRuleHit } from "./hard-rules-engine";
import type { OcrArtifact } from "./ocr-confirmation";
import type { Verdict } from "./verdict-policy";

export type ContactInfo = {
  phone: string;
  email?: string;
};

export type Person = {
  id: PersonId;
  fullName: string;
  contacts: ContactInfo;
  dpi?: string;
  address?: string;
  status: PersonStatus;
  createdAt: string;
};

export type Guarantor = {
  fullName: string;
  dpi?: string;
  phone?: string;
  relationship?: string;
};

export type AiAlertResolution = {
  status: import("@crece/shared").AiAlertResolutionStatus;
  reason?: string;
  byUserId: UserId;
  at: string;
};

export type AiAlert = {
  type: import("@crece/shared").AiAlertType;
  message: string;
  sourceDocumentId: DocumentId;
  resolution?: AiAlertResolution;
};

export type AiAssistance = {
  triggeredAt: string;
  summaryMarkdown: string;
  alerts: AiAlert[];
  optionalDraft5C?: string;
};

export type Operation = {
  id: OperationId;
  personId: PersonId;
  productType: ProductType;
  guaranteeType: GuaranteeType;
  hasGuarantor: boolean;
  guarantor?: Guarantor;
  requestedAmount: Money;
  approvedAmount?: Money;
  termMonths: number;
  approvedTermMonths?: number;
  interestRate?: number;
  purpose: string;
  state: import("@crece/shared").OperationState;
  checklist: ChecklistItem[];
  assessment?: FinancialAssessmentInput;
  guarantorAssessment?: GuarantorAssessmentInput;
  calcResult?: CalcResult;
  hardRuleHits: HardRuleHit[];
  ocrArtifacts?: OcrArtifact[];
  verdicts: Verdict[];
  aiAssistance?: AiAssistance;
  opinion?: Opinion5C;
  returnComment?: string;
  submittedForReviewAt?: string;
  minutesHtml?: string;
  createdBy: UserId;
  createdAt: string;
  updatedAt: string;
};

export type DocumentAsset = {
  id: DocumentId;
  operationId: OperationId;
  checklistCode: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
  uploadedBy: UserId;
  uploadedAt: string;
};

export type DecisionLogEntry = {
  id: string;
  operationId: OperationId;
  action: string;
  actorUserId: UserId;
  actorOffice: import("@crece/shared").Office;
  details: Record<string, unknown>;
  at: string;
};

export type DecisionFactor = {
  id: string;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number;
};

export type DocumentTemplate = {
  id: string;
  code: string;
  name: string;
  version: number;
  templateType: string;
  approvedByCooperative: boolean;
  active: boolean;
};

export type GeneratedDocument = {
  id: string;
  operationId?: OperationId;
  savingsOpId?: string;
  templateCode: string;
  templateVersion: number;
  fileName: string;
  storageKey: string;
  dataSnapshot: Record<string, unknown>;
  generatedBy: UserId;
  generatedAt: string;
};

export type Beneficiary = {
  fullName: string;
  dpi?: string;
  percentage: number;
  relationship?: string;
};

export type SavingsOperation = {
  id: string;
  personId: PersonId;
  type: SavingsOperationType;
  amount: Money;
  termMonths?: number;
  maturesAt?: string;
  beneficiaries: Beneficiary[];
  state: string;
  createdBy: UserId;
  createdAt: string;
};

export type PipelineMetrics = {
  waitingCount: number;
  waitingRed: boolean;
  checklistIncompleteCount: number;
  checklistIncompleteRed: boolean;
  docsExpiringCount: number;
  docsExpiringRed: boolean;
  unjustifiedRulesCount: number;
  unjustifiedRulesRed: boolean;
  monthlyFunnel: { submitted: number; approved: number; rejected: number };
  fixedTermMaturingCount: number;
  fixedTermMaturingRed: boolean;
};
