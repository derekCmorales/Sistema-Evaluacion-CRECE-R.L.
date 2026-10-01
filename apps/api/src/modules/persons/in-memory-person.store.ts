import { Injectable } from "@nestjs/common";
import {
  MOCK_PERSON_ACTIVE,
  MOCK_PERSON_PROSPECT,
  type Person,
} from "@crece/domain";

@Injectable()
export class InMemoryPersonStore {
  private readonly persons = new Map<string, Person>();

  constructor() {
    this.persons.set(MOCK_PERSON_PROSPECT.id, MOCK_PERSON_PROSPECT);
    this.persons.set(MOCK_PERSON_ACTIVE.id, MOCK_PERSON_ACTIVE);
  }

  list(): Person[] {
    return [...this.persons.values()];
  }

  getById(id: string): Person | undefined {
    return this.persons.get(id);
  }

  getByDpi(dpi: string): Person | undefined {
    const cleanDpi = dpi.replace(/[\s-]/g, "");
    return [...this.persons.values()].find((p) => p.dpi === cleanDpi);
  }

  add(person: Person): Person {
    return this.save(person);
  }

  save(person: Person): Person {
    this.persons.set(person.id, person);
    return person;
  }

  /** Prospecto de la landing, todavía sin DPI, con el mismo teléfono. */
  findOpenProspectByPhone(phone: string): Person | undefined {
    const key = phone.replace(/\D/g, "");
    return [...this.persons.values()].find(
      (person) =>
        person.status === "PROSPECT" &&
        !person.dpi &&
        person.contacts.phone.replace(/\D/g, "") === key,
    );
  }
}
