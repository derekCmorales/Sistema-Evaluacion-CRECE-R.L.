import { randomUUID } from "node:crypto";
import {
  DEFAULT_AUTHORIZATION_POLICY,
  DEFAULT_RATES_CONFIG,
  DEFAULT_SEMAPHORE_CONFIG,
  toOperationId,
  toPersonId,
  type OperationId,
  type OperationSubmittedForReview,
  type UserId,
} from "@crece/shared";
import type {
  AuditEntry,
  AuditLog,
  ConfigRepository,
  DecisionLog,
  DecisionLogEntry,
  Operation,
  OperationRepository,
  Person,
  PersonRepository,
  ReviewFactsPublisher,
} from "@crece/domain";

/**
 * Memoria de proceso: implementa los puertos de dominio mientras no exista el change de
 * persistencia (Prisma). Una sola instancia por proceso: landing, personas y operaciones
 * leen y escriben el mismo repositorio. Se pierde al reiniciar la API.
 */

export class InMemoryPersonRepository implements PersonRepository {
  private readonly items = new Map<string, Person>();

  async findById(id: string) {
    return clone(this.items.get(id) ?? null);
  }

  async findByDpi(dpi: string) {
    return clone([...this.items.values()].find((p) => p.dpi === dpi) ?? null);
  }

  async findAll() {
    return [...this.items.values()].map((p) => clone(p));
  }

  async create(person: Omit<Person, "id" | "createdAt"> & { id?: Person["id"] }) {
    const created: Person = { ...person, id: person.id ?? toPersonId(randomUUID()), createdAt: new Date().toISOString() };
    this.items.set(created.id, clone(created));
    return created;
  }

  async update(person: Person) {
    this.items.set(person.id, clone(person));
    return person;
  }
}

export class InMemoryOperationRepository implements OperationRepository {
  private readonly items = new Map<string, Operation>();

  async findById(id: string) {
    return clone(this.items.get(id) ?? null);
  }

  async findByPersonId(personId: string) {
    return [...this.items.values()].filter((o) => o.personId === personId).map((o) => clone(o));
  }

  async findAll() {
    return [...this.items.values()].map((o) => clone(o));
  }

  async create(operation: Omit<Operation, "id" | "createdAt" | "updatedAt"> & { id?: Operation["id"] }) {
    const now = new Date().toISOString();
    const created: Operation = {
      ...operation,
      id: operation.id ?? toOperationId(randomUUID()),
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(created.id, clone(created));
    return created;
  }

  async update(operation: Operation) {
    this.items.set(operation.id, clone(operation));
    return operation;
  }
}

/** Append-only: no expone modificar ni borrar entradas. */
export class InMemoryAuditLog implements AuditLog {
  private readonly entries: AuditEntry[] = [];

  async append(entry: Omit<AuditEntry, "id" | "at">) {
    const saved: AuditEntry = { ...entry, id: randomUUID(), at: new Date().toISOString() };
    this.entries.push(saved);
    return saved;
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.entries.filter((e) => e.entityType === entityType && e.entityId === entityId);
  }

  async findAll(limit?: number) {
    return limit === undefined ? [...this.entries] : this.entries.slice(-limit);
  }
}

/** Bitácora de decisiones de la fase 7. Append-only: no expone modificar ni borrar. */
export class InMemoryDecisionLog implements DecisionLog {
  private readonly entries: DecisionLogEntry[] = [];

  async append(entry: Omit<DecisionLogEntry, "id" | "at">) {
    const saved: DecisionLogEntry = { ...entry, id: randomUUID(), at: new Date().toISOString() };
    this.entries.push(saved);
    return saved;
  }

  async findByOperation(operationId: OperationId) {
    return this.entries.filter((e) => e.operationId === operationId);
  }
}

/**
 * Recibe el hecho del envío a revisión. Hasta que la fase 6 conecte el motor (tarea D3),
 * solo lo guarda en memoria; los suscriptores se registran con `subscribe`.
 */
export class InMemoryReviewFactsPublisher implements ReviewFactsPublisher {
  private readonly published: OperationSubmittedForReview[] = [];
  private readonly subscribers: Array<(fact: OperationSubmittedForReview) => Promise<void>> = [];

  subscribe(handler: (fact: OperationSubmittedForReview) => Promise<void>) {
    this.subscribers.push(handler);
  }

  async publish(fact: OperationSubmittedForReview) {
    this.published.push(fact);
    for (const handler of this.subscribers) await handler(fact);
  }

  history(): readonly OperationSubmittedForReview[] {
    return this.published;
  }
}

/** Configuración con valores semilla; el valor vivo vendrá de la tabla de configuración. */
export class SeedConfigRepository implements ConfigRepository {
  private readonly values = new Map<string, unknown>();

  async get<T>(key: string, fallback: T): Promise<T> {
    return this.values.has(key) ? (this.values.get(key) as T) : fallback;
  }

  async set(key: string, value: unknown, _byUserId: UserId): Promise<void> {
    this.values.set(key, value);
  }

  async getAuthorizationPolicy() {
    return DEFAULT_AUTHORIZATION_POLICY;
  }

  async getRatesConfig() {
    return DEFAULT_RATES_CONFIG;
  }

  async getSemaphoreConfig() {
    return DEFAULT_SEMAPHORE_CONFIG;
  }
}

/** Copia defensiva: nadie muta lo guardado por referencia. */
function clone<T>(value: T): T {
  return value === null ? value : structuredClone(value);
}
