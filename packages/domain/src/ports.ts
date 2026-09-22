/**
 * Puertos de dominio. Interfaces PascalCase **sin** prefijo `I`.
 * Los adaptadores viven en apps/api (Nest) o un paquete de infraestructura futuro.
 */
import type {
  AuthorizationPolicy,
  DocumentId,
  OperationId,
  PersonId,
  UserId,
  Office,
  NotificationType,
} from "@crece/shared";
import type { CalcEngineInput, CalcResult, FinancialAssessmentInput } from "./calc-engine";
import type { AuditEntry } from "./audit-log";
import type {
  AiAlert,
  DecisionFactor,
  DecisionLogEntry,
  DocumentAsset,
  DocumentTemplate,
  GeneratedDocument,
  Operation,
  Person,
  PipelineMetrics,
  SavingsOperation,
} from "./entities";

export type PersonRepository = {
  findById(id: PersonId): Promise<Person | null>;
  findByDpi(dpi: string): Promise<Person | null>;
  findAll(): Promise<Person[]>;
  create(person: Omit<Person, "id" | "createdAt"> & { id?: PersonId }): Promise<Person>;
  update(person: Person): Promise<Person>;
};

export type OperationRepository = {
  findById(id: OperationId): Promise<Operation | null>;
  findByPersonId(personId: PersonId): Promise<Operation[]>;
  findAll(): Promise<Operation[]>;
  create(
    operation: Omit<Operation, "id" | "createdAt" | "updatedAt"> & { id?: OperationId },
  ): Promise<Operation>;
  update(operation: Operation): Promise<Operation>;
};

export type DocumentStore = {
  upload(params: {
    operationId: OperationId;
    checklistCode: string;
    fileName: string;
    mimeType: string;
    bytes: Uint8Array;
    uploadedBy: UserId;
  }): Promise<DocumentAsset>;
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
  delete(storageKey: string): Promise<void>;
};

export type CalcEngine = {
  calculate(input: CalcEngineInput): CalcResult;
  hashInputs(input: CalcEngineInput): string;
};

export type DecisionLog = {
  append(entry: Omit<DecisionLogEntry, "id" | "at">): Promise<DecisionLogEntry>;
  findByOperation(operationId: OperationId): Promise<DecisionLogEntry[]>;
};

export type AuditLog = {
  append(entry: Omit<AuditEntry, "id" | "at">): Promise<AuditEntry>;
  findByEntity(entityType: string, entityId: string): Promise<AuditEntry[]>;
  findAll(limit?: number): Promise<AuditEntry[]>;
};

export type DecisionFactorRepository = {
  findAll(): Promise<DecisionFactor[]>;
  findActive(): Promise<DecisionFactor[]>;
  create(factor: Omit<DecisionFactor, "id">): Promise<DecisionFactor>;
  update(factor: DecisionFactor): Promise<DecisionFactor>;
};

export type DocumentTemplateRepository = {
  findByCode(code: string): Promise<DocumentTemplate | null>;
  findAll(): Promise<DocumentTemplate[]>;
};

export type GeneratedDocumentRepository = {
  create(
    doc: Omit<GeneratedDocument, "id" | "generatedAt">,
  ): Promise<GeneratedDocument>;
  findByOperation(operationId: OperationId): Promise<GeneratedDocument[]>;
};

export type SavingsOperationRepository = {
  findById(id: string): Promise<SavingsOperation | null>;
  findByPersonId(personId: PersonId): Promise<SavingsOperation[]>;
  findAll(): Promise<SavingsOperation[]>;
  create(op: Omit<SavingsOperation, "id" | "createdAt">): Promise<SavingsOperation>;
  update(op: SavingsOperation): Promise<SavingsOperation>;
};

export type RatesConfig = {
  creditAnnualRatePercent: number;
  fixedTermRates: { minMonths: number; maxMonths: number; annualRatePercent: number };
  maxInstallmentToIncomeRatio: number;
  accountOpeningFeeGTQ: number;
  membershipFeeGTQ?: number;
  provisional: boolean;
};

export type SemaphoreConfig = {
  waitingDaysRed: number;
  checklistIncompletePercent: number;
  docExpiryWarningDays: number;
  waitingReminderDays: number;
};

export type ConfigRepository = {
  get<T>(key: string, fallback: T): Promise<T>;
  set(key: string, value: unknown, byUserId: UserId): Promise<void>;
  getAuthorizationPolicy(): Promise<AuthorizationPolicy>;
  getRatesConfig(): Promise<RatesConfig>;
  getSemaphoreConfig(): Promise<SemaphoreConfig>;
};

export type Notifier = {
  notify(input: {
    userId: UserId;
    type: NotificationType;
    title: string;
    body: string;
    href?: string;
  }): Promise<void>;
};

export type PipelineMetricsPort = {
  compute(): Promise<PipelineMetrics>;
};

export type DocumentRenderer = {
  renderApplicationSummary(operation: Operation, person: Person): Promise<Uint8Array>;
  renderAmortization(operation: Operation, person: Person): Promise<Uint8Array>;
  renderFromTemplate(
    template: DocumentTemplate,
    data: Record<string, unknown>,
  ): Promise<Uint8Array>;
};

export type AuthGateway = {
  getSessionUser(): Promise<{
    id: UserId;
    offices: Office[];
    name: string;
    email: string;
  } | null>;
};

export type OcrProvider = {
  extractText(storageKey: string): Promise<string>;
};

export type LlmAssistant = {
  contrastBureau(
    declared: FinancialAssessmentInput,
    ocrText: string,
    ragHits: string[],
  ): Promise<AiAlert[]>;
  checkCoherence(operation: Operation, ragHits: string[]): Promise<AiAlert[]>;
  buildOnePageSummary(operation: Operation, alerts: AiAlert[]): Promise<string>;
  draft5C(operation: Operation): Promise<string>;
};

export type EmbeddingProvider = {
  embed(text: string): Promise<number[]>;
};

export type RagStore = {
  index(id: string, text: string, embedding: number[]): Promise<void>;
  search(query: string, limit?: number): Promise<string[]>;
};

export type { DocumentId };
