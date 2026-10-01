import {
  DEFAULT_RATES_CONFIG,
  toOperationId,
  toPersonId,
  toUserId,
  type Actor,
  type OperationId,
  type PersonId,
} from "@crece/shared";
import type { AuditEntry, AuditLog, Operation, OperationRepository, Person, PersonRepository } from "@crece/domain";
import type { CaptureDeps } from "../capture-deps";

/** Puertos falsos en memoria para probar los casos de uso sin Nest ni base de datos. */
export function fakeCaptureDeps(config: Record<string, unknown> = {}) {
  let seq = 0;
  let tick = 0;
  const now = () => new Date(Date.UTC(2026, 8, 30, 8, 0, tick++)).toISOString();
  const persons = new Map<string, Person>();
  const operations = new Map<string, Operation>();
  const audit: AuditEntry[] = [];

  const personRepo: PersonRepository = {
    findById: async (id) => persons.get(id) ?? null,
    findByDpi: async (dpi) => [...persons.values()].find((p) => p.dpi === dpi) ?? null,
    findAll: async () => [...persons.values()],
    create: async (p) => {
      const person = { ...p, id: p.id ?? toPersonId(`person-${++seq}`), createdAt: now() } as Person;
      persons.set(person.id, person);
      return person;
    },
    update: async (p) => {
      persons.set(p.id, p);
      return p;
    },
  };

  const operationRepo: OperationRepository = {
    findById: async (id) => operations.get(id) ?? null,
    findByPersonId: async (personId) => [...operations.values()].filter((o) => o.personId === personId),
    findAll: async () => [...operations.values()],
    create: async (o) => {
      const at = now();
      const operation = { ...o, id: o.id ?? toOperationId(`op-${++seq}`), createdAt: at, updatedAt: at } as Operation;
      operations.set(operation.id, operation);
      return operation;
    },
    update: async (o) => {
      operations.set(o.id, o);
      return o;
    },
  };

  const auditLog: AuditLog = {
    append: async (entry) => {
      const saved = { ...entry, id: `audit-${audit.length + 1}`, at: now() };
      audit.push(saved);
      return saved;
    },
    findByEntity: async (type, id) => audit.filter((e) => e.entityType === type && e.entityId === id),
    findAll: async () => [...audit],
  };

  const deps: CaptureDeps = {
    persons: personRepo,
    operations: operationRepo,
    audit: auditLog,
    config: {
      get: async <T>(key: string, fallback: T) => (key in config ? (config[key] as T) : fallback),
      getRatesConfig: async () => DEFAULT_RATES_CONFIG,
    },
    now,
    newId: () => `id-${++seq}`,
  };

  return {
    deps,
    audit,
    person: (id: PersonId | string) => persons.get(id),
    operation: (id: OperationId | string) => operations.get(id),
  };
}

export const advisor: Actor = { userId: toUserId("user-mario"), offices: ["BRANCH_HEAD", "ADVISOR"] };
export const councilMember: Actor = { userId: toUserId("user-julio"), offices: ["COUNCIL_MEMBER"] };
export const oversight: Actor = { userId: toUserId("user-vigilancia"), offices: ["OVERSIGHT"] };
