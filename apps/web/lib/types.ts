import type { AuditEntry, CaseAssemblyStatus, Operation, Person } from "@crece/domain";
import type { OperationListItem } from "@crece/shared";

/** Formas de respuesta de la API de captación (solo tipos; ninguna lógica de dominio en la web). */
export type CaseFile = { operation: Operation; assembly: CaseAssemblyStatus; canEdit: boolean };
export type PersonProfile = { person: Person; operations: OperationListItem[] };
export type History = { items: AuditEntry[] };
