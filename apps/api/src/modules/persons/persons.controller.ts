import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { parseCreatePerson, toPersonEntity } from "@crece/application";
import { InMemoryPersonStore } from "./in-memory-person.store";

@Controller("persons")
export class PersonsController {
  constructor(private readonly store: InMemoryPersonStore) {}

  @Get()
  list() {
    return {
      persistence: "in-memory-contracts",
      items: this.store.list(),
    };
  }

  /**
   * Búsqueda por DPI para deduplicación (Fase 1).
   * Si ya existe, se devuelve para reutilizar el perfil sin duplicar.
   */
  @Get("by-dpi/:dpi")
  getByDpi(@Param("dpi") dpi: string) {
    const person = this.store.getByDpi(dpi);
    if (!person) {
      throw new NotFoundException(`No existe persona registrada con DPI ${dpi}`);
    }
    return person;
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    const person = this.store.getById(id);
    if (!person) {
      throw new NotFoundException(`Persona con id ${id} no encontrada`);
    }
    return person;
  }

  /**
   * Registro del solicitante (Fase 1).
   * Falla con ConflictException si el DPI ya está registrado.
   */
  @Post()
  create(@Body() body: unknown) {
    const parsed = parseCreatePerson(body);
    const existing = this.store.getByDpi(parsed.dpi);
    if (existing) {
      throw new ConflictException(
        `Ya existe una persona registrada con el DPI ${parsed.dpi}. No se duplican perfiles; asocie la solicitud a la persona existente (${existing.id}).`,
      );
    }

    const person = toPersonEntity(parsed, randomUUID());
    const stored = this.store.add(person);
    return {
      personId: stored.id,
      fullName: stored.fullName,
      dpi: stored.dpi,
      status: stored.status,
      source: stored.source,
      interest: stored.interest,
      registeredByUserId: stored.registeredByUserId,
      createdAt: stored.createdAt,
    };
  }
}
