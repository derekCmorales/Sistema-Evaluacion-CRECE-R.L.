import { randomUUID } from "node:crypto";
import type { IntakeDeps } from "@crece/application";
import type { WatchlistSource } from "@crece/shared";
import { InMemoryPersonStore } from "../persons/in-memory-person.store";
import { InMemoryOperationStore } from "../operations/in-memory-operation.store";
import { InMemoryAuditLog } from "./in-memory-audit-log";

export function intakeDeps(
  persons: InMemoryPersonStore,
  operations: InMemoryOperationStore,
  audit: InMemoryAuditLog,
  requiredWatchlists?: readonly WatchlistSource[],
): IntakeDeps {
  return {
    persons: {
      findById: (id) => persons.getById(id) ?? null,
      findByDpi: (dpi) => persons.getByDpi(dpi) ?? null,
      findOpenProspectByPhone: (phone) => persons.findOpenProspectByPhone(phone) ?? null,
      list: () => persons.list(),
      save: (person) => persons.save(person),
    },
    operations: {
      findById: (id) => operations.get(id) ?? null,
      findByPersonId: (personId) => operations.getByPersonId(personId),
      list: () => operations.list(),
      save: (operation) => operations.save(operation),
    },
    audit: {
      append: (entry) => {
        audit.append(entry);
      },
    },
    now: () => new Date().toISOString(),
    newId: () => randomUUID(),
    requiredWatchlists,
  };
}
