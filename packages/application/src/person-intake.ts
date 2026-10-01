import {
  DuplicatePersonError,
  LANDING_ACTOR_ID,
  NotFoundError,
  toPersonId,
  type Actor,
  type OperationListItem,
  type PersonListItem,
  type PersonSource,
} from "@crece/shared";
import { assignDpi, createProspect, type Person } from "@crece/domain";
import { assertPermission } from "./actor";
import {
  appendAudit,
  toOperationListItem,
  toPersonListItem,
  type CaptureDeps,
} from "./capture-deps";
import { parseDpiBody, parseRegisterPerson } from "./person-contracts";
import { parsePublicProspect } from "./public-prospect";

/**
 * Fase 1 — registro del solicitante. Landing y agencia escriben en el mismo
 * `PersonRepository`: una persona es una sola identidad, venga de donde venga.
 */

/** Contrato landing → sistema. Crea solo `Person` PROSPECT; nunca `Operation`. */
export async function registerLandingProspect(deps: CaptureDeps, body: unknown): Promise<Person> {
  const input = parsePublicProspect({ ...asObject(body), source: "LANDING" });
  const person = await deps.persons.create(
    createProspect({
      fullName: input.fullName,
      contacts: { phone: input.phone, email: input.email },
      source: "LANDING",
      interest: input.interest,
      intakeNote: { amountHint: input.amountHint, message: input.message },
      contactConsentAt: deps.now(),
    }),
  );
  await appendAudit(deps, {
    entityType: "Person",
    entityId: person.id,
    action: "PROSPECT_CREATED",
    byUserId: LANDING_ACTOR_ID,
  });
  return person;
}

/** Registro en agencia: el DPI es la llave; si ya existe, se reutiliza ese perfil. */
export async function registerPerson(deps: CaptureDeps, actor: Actor, body: unknown): Promise<Person> {
  assertPermission(actor, "person:create");
  const input = parseRegisterPerson(body);
  const existing = await deps.persons.findByDpi(input.dpi);
  if (existing) {
    throw new DuplicatePersonError(existing.id);
  }
  const person = await deps.persons.create(
    createProspect({
      fullName: input.fullName,
      dpi: input.dpi,
      contacts: { phone: input.phone, email: input.email },
      source: "ADVISOR",
      interest: input.interest,
      registeredByUserId: actor.userId,
    }),
  );
  await appendAudit(deps, {
    entityType: "Person",
    entityId: person.id,
    action: "PERSON_REGISTERED",
    byUserId: actor.userId,
  });
  return person;
}

/** Completa el DPI de un prospecto de la landing sin crear una segunda persona. */
export async function assignPersonDpi(
  deps: CaptureDeps,
  actor: Actor,
  personId: string,
  body: unknown,
): Promise<Person> {
  assertPermission(actor, "person:create");
  const dpi = parseDpiBody(body);
  const person = await requirePerson(deps, personId);
  const owner = await deps.persons.findByDpi(dpi);
  if (owner && owner.id !== person.id) {
    throw new DuplicatePersonError(owner.id);
  }
  const updated = await deps.persons.update(assignDpi(person, dpi));
  if (person.dpi !== updated.dpi) {
    await appendAudit(deps, {
      entityType: "Person",
      entityId: person.id,
      action: "PERSON_DPI_ASSIGNED",
      byUserId: actor.userId,
    });
  }
  return updated;
}

export type PersonFilter = { source?: PersonSource };

export async function listPersons(
  deps: CaptureDeps,
  actor: Actor,
  filter: PersonFilter = {},
): Promise<PersonListItem[]> {
  assertPermission(actor, "person:read");
  const persons = (await deps.persons.findAll()).filter((p) => !filter.source || p.source === filter.source);
  const items = await Promise.all(
    persons.map(async (person) =>
      toPersonListItem(person, (await deps.operations.findByPersonId(person.id)).length),
    ),
  );
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Búsqueda previa al registro para no duplicar identidades. */
export async function findPersonByDpi(
  deps: CaptureDeps,
  actor: Actor,
  body: unknown,
): Promise<PersonListItem | null> {
  assertPermission(actor, "person:read");
  const person = await deps.persons.findByDpi(parseDpiBody(body));
  if (!person) return null;
  return toPersonListItem(person, (await deps.operations.findByPersonId(person.id)).length);
}

export type PersonProfile = {
  person: Person;
  operations: OperationListItem[];
};

/** Perfil con el historial de solicitudes de la persona (más reciente primero). */
export async function getPersonProfile(
  deps: CaptureDeps,
  actor: Actor,
  personId: string,
): Promise<PersonProfile> {
  assertPermission(actor, "person:read");
  const person = await requirePerson(deps, personId);
  const operations = await deps.operations.findByPersonId(person.id);
  return {
    person,
    operations: operations
      .map(toOperationListItem)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export async function requirePerson(deps: CaptureDeps, personId: string): Promise<Person> {
  const person = await deps.persons.findById(toPersonId(personId));
  if (!person) {
    throw new NotFoundError("No encontramos a esa persona");
  }
  return person;
}

function asObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
}
