import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AuditEntry } from "@crece/domain";

@Injectable()
export class InMemoryAuditLog {
  private readonly entries: AuditEntry[] = [];

  append(entry: Omit<AuditEntry, "id" | "at">): AuditEntry {
    const stored: AuditEntry = {
      ...entry,
      id: randomUUID(),
      at: new Date().toISOString(),
    };
    this.entries.push(stored);
    return stored;
  }

  list(): AuditEntry[] {
    return [...this.entries];
  }
}
