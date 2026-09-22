import { Injectable } from "@nestjs/common";
import type { Person } from "@crece/domain";
import type { PublicProspectInput } from "@crece/application";

export type StoredProspect = Person & {
  interest: PublicProspectInput["interest"];
  amountHint?: number;
  message?: string;
  source: PublicProspectInput["source"];
};

/**
 * Memoria de proceso: demuestra el contrato público sin Prisma.
 * Se reemplaza por PersonRepository (PostgreSQL) en el change de persistencia.
 */
@Injectable()
export class InMemoryProspectStore {
  private readonly items = new Map<string, StoredProspect>();

  add(prospect: StoredProspect): StoredProspect {
    this.items.set(prospect.id, prospect);
    return prospect;
  }

  list(): StoredProspect[] {
    return [...this.items.values()];
  }

  get(id: string): StoredProspect | undefined {
    return this.items.get(id);
  }
}
